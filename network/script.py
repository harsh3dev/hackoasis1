import time
import numpy as np
import pandas as pd
from scapy.all import sniff, IP, TCP, UDP
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware  # Import CORS middleware
from typing import Optional
import uvicorn

app = FastAPI()

# Define allowed origins (adjust this as needed)
origins = [
    "http://localhost:5173",  # Your frontend origin
]

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Allows all origins from the origins list
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all headers
)

packets_data = []

# Callback for processing each packet
def packet_callback(packet):
    if IP in packet:
        src_ip = packet[IP].src
        dst_ip = packet[IP].dst
        proto = packet[IP].proto
        timestamps = [packet.time]
        lengths = [len(packet)]
        src_port = dst_port = None

        if TCP in packet:
            src_port = packet[TCP].sport
            dst_port = packet[TCP].dport
        elif UDP in packet:
            src_port = packet[UDP].sport
            dst_port = packet[UDP].dport

        # Append packet info to global list
        packets_data.append({
            'src_ip': src_ip,
            'dst_ip': dst_ip,
            'protocol': proto,
            'src_port': src_port,
            'dst_port': dst_port,
            'timestamp': packet.time,
            'length': len(packet)
        })

# Function to process the captured packets and extract desired features
def process_packets():
    if not packets_data:
        return []

    flows = {}
    for pkt in packets_data:
        flow_id = (pkt['src_ip'], pkt['dst_ip'], pkt['protocol'], pkt['src_port'], pkt['dst_port'])
        if flow_id not in flows:
            flows[flow_id] = {
                'timestamps': [],
                'lengths': [],
                'tot_fwd_pkts': 0,
                'tot_len_fwd_pkts': 0
            }
        
        flow = flows[flow_id]
        flow['timestamps'].append(pkt['timestamp'])
        flow['lengths'].append(pkt['length'])
        flow['tot_fwd_pkts'] += 1
        flow['tot_len_fwd_pkts'] += pkt['length']
    
    flow_features = []

    for (src_ip, dst_ip, proto, src_port, dst_port), flow in flows.items():
        timestamps = flow['timestamps']
        lengths = flow['lengths']
        first_packet_time = time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(min(timestamps)))
        last_packet_time = time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(max(timestamps)))
        flow_duration = max(timestamps) - min(timestamps)

        flow_features.append({
            'src_ip': src_ip,
            'dst_ip': dst_ip,
            'protocol': proto,
            'src_port': src_port,
            'dst_port': dst_port,
            'first_packet_time': first_packet_time,
            'last_packet_time': last_packet_time,
            'flow_duration': flow_duration,
            'tot_fwd_pkts': flow['tot_fwd_pkts'],
            'tot_len_fwd_pkts': flow['tot_len_fwd_pkts'],
            'fwd_pkt_len_max': max(lengths),
            'fwd_pkt_len_min': min(lengths),
            'fwd_pkt_len_mean': np.mean(lengths),
            'fwd_pkt_len_std': np.std(lengths),
            'flow_byts_per_sec': flow['tot_len_fwd_pkts'] / flow_duration if flow_duration > 0 else 0,
            'flow_pkts_per_sec': flow['tot_fwd_pkts'] / flow_duration if flow_duration > 0 else 0,
        })
    
    return flow_features

# FastAPI endpoint to collect and process network data
@app.get("/collect-data")
def get_network_data(duration: Optional[int] = 60):
    # Start sniffing packets
    global packets_data
    packets_data = []
    sniff(prn=packet_callback, timeout=duration)

    # Process and extract features from packets
    flow_features = process_packets()

    if not flow_features:
        return {"error": "No data collected"}

    # Return the extracted features
    return flow_features

# Run the FastAPI app
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
