from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import joblib
import pandas as pd
import numpy as np
from tensorflow.keras.models import load_model
from keras.losses import MeanSquaredError
from pymongo import MongoClient

app = Flask(__name__)
CORS(app)

# MongoDB connection
client = MongoClient("mongodb://localhost:27017/")  # Replace with your connection string if using MongoDB Atlas
db = client['prediction_db']  # Your database name
collection = db['predictions']  # Your collection name

# Load the autoencoder model and scaler
autoencoder = load_model('autoencoder_model.h5', custom_objects={'mse': MeanSquaredError()})
scaler = joblib.load('scaler.pkl')

class FeatureExtractor:
    def transform(self, X):
        df = pd.DataFrame(X, columns=['timestamp', 'x_position', 'y_position', 'event_name'])

        # Drop the 'event_name' as it's not needed
        df = df.drop(columns=['event_name'])

        # Handle missing positions
        df.loc[(df['x_position'] == 0) & (df['y_position'] == 0), ['x_position', 'y_position']] = np.nan
        df[['x_position', 'y_position']] = df[['x_position', 'y_position']].ffill()

        df['time_diff'] = df['timestamp'].diff().fillna(0)
        df['distance'] = np.sqrt((df['x_position'].diff())**2 + (df['y_position'].diff())**2).fillna(0)
        df['speed'] = df['distance'] / df['time_diff'].replace(0, np.nan)
        df['acceleration'] = df['speed'].diff() / df['time_diff'].replace(0, np.nan)
        df.fillna(0, inplace=True)

        def compute_angle_diff(x1, y1, x2, y2):
            angle = np.arctan2(y2 - y1, x2 - x1)
            return np.degrees(angle)

        df['angle_diff'] = compute_angle_diff(df['x_position'].shift(1), df['y_position'].shift(1),
                                              df['x_position'], df['y_position']).fillna(0)

        summary = pd.DataFrame({
            'speed_mean': [df['speed'].mean()],
            'speed_std': [df['speed'].std()],
            'acceleration_mean': [df['acceleration'].mean()],
            'acceleration_std': [df['acceleration'].std()],
            'angle_diff_mean': [df['angle_diff'].mean()],
            'angle_diff_std': [df['angle_diff'].std()],
        })

        return summary


class AutoencoderPredictor:
    def __init__(self, model, threshold=200):
        self.model = model
        self.threshold = threshold

    def transform(self, X):
        y_reconstructed = self.model.predict(X)
        reconstruction_error = np.mean(np.square(X - y_reconstructed), axis=1)
        is_bot = reconstruction_error < self.threshold

        return pd.DataFrame({
            'reconstruction_error': reconstruction_error,
            'bot': is_bot
        })

# Create the pipeline
feature_extractor = FeatureExtractor()
autoencoder_predictor = AutoencoderPredictor(autoencoder)

@app.route('/predict', methods=['POST'])
def predict():
    try:
        # Parse the incoming JSON request
    
        data = request.json
        print("incoming data",data)
        client_ip = request.remote_addr
        user_agent = request.headers.get('User-Agent')
        
        # Ensure that mouseMoveCount and keyPressCount are in the input
        if 'mouseMoveCount' not in data or 'keyPressCount' not in data:
            return jsonify({"error": "mouseMoveCount and keyPressCount are required"}), 400
        
        mouse_move_count = data.get('mouseMoveCount')
        key_press_count = data.get('keyPressCount')
        
        # Remove mouseMoveCount and keyPressCount from data to avoid issues during processing
        input_data = data['events']  # Assuming the rest of the input data is in a 'data' key

        # Convert JSON to DataFrame
        input_df = pd.DataFrame(input_data)
        
        # Validate input
        required_columns = ['timestamp', 'x_position', 'y_position']
        if not all(col in input_df.columns for col in required_columns):
            return jsonify({"error": "Invalid input format"}), 400
        
        # Extract features
        features = feature_extractor.transform(input_df)

        # Scale the features
        scaled_features = scaler.transform(features)

        # Make predictions
        result = autoencoder_predictor.transform(scaled_features)

        current_timestamp = datetime.utcnow().isoformat() + 'Z'  

        # Create the response
        response = {
            'ip_address': client_ip,
            'user_agent': user_agent,
            'current_timestamp': current_timestamp,
            'mouseMoveCount': mouse_move_count,
            'keyPressCount': key_press_count,
            'prediction': result.to_dict(orient='records')
        }

        # Insert the result into MongoDB
        db_record = {
            'ip_address': client_ip,
            'user_agent': user_agent,
            'timestamp': current_timestamp,
            'input_data': input_data,
            'mouseMoveCount': mouse_move_count,
            'keyPressCount': key_press_count,
            'prediction': result.to_dict(orient='records')
        }
        collection.insert_one(db_record)  # Insert into MongoDB

        return jsonify(response)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 400


@app.route('/predictions', methods=['GET'])
def get_predictions():
    try:
        predictions = list(collection.find({}))
        # Convert MongoDB documents to a more JSON-friendly format
        for prediction in predictions:
            prediction['_id'] = str(prediction['_id'])  # Convert ObjectId to string
        return jsonify(predictions), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)

