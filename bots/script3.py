import pickle
from flask import Flask, request, jsonify
import numpy as np

app = Flask(__name__)


model_path = 'pipeline_filename.pkl'
with open(model_path, 'rb') as file:
    model = pickle.load(file)


@app.route('/predict', methods=['POST'])
def predict():
    
    data = request.json

    predictions = []

    for event in data:
        event_name = event.get('event_name')
        timestamp = event.get('timestamp')
        x_position = event.get('x_position')
        y_position = event.get('y_position')

        
        features = np.array([[timestamp, x_position, y_position]])

        
        prediction = model.predict(features)

        predictions.append({
            "event_name": event_name,
            "prediction": prediction[0]
        })

    
    return jsonify(predictions)

if __name__ == '__main__':
    app.run(debug=True)  