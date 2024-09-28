import React, { useState, useEffect } from "react";

function NetworkData() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch("http://localhost:8000/collect-data?duration=60")
      .then((response) => response.json())
      .then((data) => setData(data))
      .catch((error) => console.error("Error fetching data:", error));
  }, []);

  return (
    <div>
      <h1>Network Data</h1>
      {data.length === 0 ? (
        <p>No data collected</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Source IP</th>
              <th>Destination IP</th>
              <th>Protocol</th>
              <th>Source Port</th>
              <th>Destination Port</th>
              <th>First Packet Time</th>
              <th>Last Packet Time</th>
              <th>Flow Duration</th>
              <th>Total Forward Packets</th>
              <th>Total Forward Length</th>
              <th>Max Packet Length</th>
              <th>Min Packet Length</th>
              <th>Mean Packet Length</th>
              <th>Std Packet Length</th>
              <th>Flow Bytes/sec</th>
              <th>Flow Packets/sec</th>
            </tr>
          </thead>
          <tbody>
            {data.map((flow, index) => (
              <tr key={index}>
                <td>{flow.src_ip}</td>
                <td>{flow.dst_ip}</td>
                <td>{flow.protocol}</td>
                <td>{flow.src_port}</td>
                <td>{flow.dst_port}</td>
                <td>{flow.first_packet_time}</td>
                <td>{flow.last_packet_time}</td>
                <td>{flow.flow_duration}</td>
                <td>{flow.tot_fwd_pkts}</td>
                <td>{flow.tot_len_fwd_pkts}</td>
                <td>{flow.fwd_pkt_len_max}</td>
                <td>{flow.fwd_pkt_len_min}</td>
                <td>{flow.fwd_pkt_len_mean}</td>
                <td>{flow.fwd_pkt_len_std}</td>
                <td>{flow.flow_byts_per_sec}</td>
                <td>{flow.flow_pkts_per_sec}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default NetworkData;
