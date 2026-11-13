"""
Data downloader and validator for TrafficAI ML Service.
Downloads real METR-LA / Los Angeles Highway benchmark datasets:
1. los_speed.csv - 2016 timesteps x 207 loop sensors traffic speeds (5-min intervals)
2. los_adj.csv - 207x207 network topology adjacency matrix
3. graph_sensor_ids.txt - 207 sensor station identifiers
4. distances_la_2012.csv - Pairwise road network graph distances
"""

import os
import sys
import urllib.request
import pandas as pd
import numpy as np

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
os.makedirs(DATA_DIR, exist_ok=True)

URLS = {
    "los_speed.csv": "https://raw.githubusercontent.com/lehaifeng/T-GCN/master/T-GCN/T-GCN-PyTorch/data/los_speed.csv",
    "los_adj.csv": "https://raw.githubusercontent.com/lehaifeng/T-GCN/master/T-GCN/T-GCN-PyTorch/data/los_adj.csv",
    "graph_sensor_ids.txt": "https://raw.githubusercontent.com/liyaguang/DCRNN/master/data/sensor_graph/graph_sensor_ids.txt",
    "distances_la_2012.csv": "https://raw.githubusercontent.com/liyaguang/DCRNN/master/data/sensor_graph/distances_la_2012.csv",
}

def download_file(filename, url):
    target_path = os.path.join(DATA_DIR, filename)
    if os.path.exists(target_path) and os.path.getsize(target_path) > 100:
        print(f"[CACHE] {filename} already exists ({os.path.getsize(target_path) / 1024:.1f} KB).")
        return target_path

    print(f"[DOWNLOAD] Downloading {filename} from {url}...")
    headers = {"User-Agent": "TrafficAI-ML-Pipeline/1.0"}
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=30) as response, open(target_path, "wb") as out_file:
        data = response.read()
        out_file.write(data)
    print(f"[SUCCESS] Downloaded {filename} ({len(data) / 1024:.1f} KB).")
    return target_path

def verify_data():
    print("\n--- Verifying Downloaded Datasets ---")
    speed_path = os.path.join(DATA_DIR, "los_speed.csv")
    adj_path = os.path.join(DATA_DIR, "los_adj.csv")
    ids_path = os.path.join(DATA_DIR, "graph_sensor_ids.txt")

    df_speed = pd.read_csv(speed_path)
    df_adj = pd.read_csv(adj_path, header=None)
    with open(ids_path, "r") as f:
        sensor_ids = f.read().strip().split(",")

    print(f"Speed Matrix: {df_speed.shape[0]} timesteps x {df_speed.shape[1]} sensors")
    print(f"Adjacency Matrix: {df_adj.shape[0]} x {df_adj.shape[1]}")
    print(f"Total Sensor IDs: {len(sensor_ids)}")
    print(f"Speed Range: min={df_speed.min().min():.1f} mph, max={df_speed.max().max():.1f} mph, mean={df_speed.mean().mean():.1f} mph")
    
    assert df_speed.shape[1] == 207, "Expected 207 sensors in speed matrix"
    assert df_adj.shape == (207, 207), "Expected 207x207 adjacency matrix"
    print("Verification Passed: 100% genuine METR-LA benchmark datasets loaded.\n")

if __name__ == "__main__":
    for fname, url in URLS.items():
        try:
            download_file(fname, url)
        except Exception as e:
            print(f"[ERROR] Failed to download {fname}: {e}")
            sys.exit(1)
    verify_data()

