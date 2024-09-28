import { useState, useEffect } from 'react'
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import axios from 'axios'
import { Activity, Clock, Database } from 'lucide-react'
import { initialData } from './initialData'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']



export default function Dashboard() {
  const [data, setData] = useState(initialData)
  const [timeSeriesData, setTimeSeriesData] = useState([])

//   useEffect(() => {
//     const interval = setInterval(() => {
//       const newData = data.map(flow => ({
//         ...flow,
//         tot_fwd_pkts: flow.tot_fwd_pkts + Math.floor(Math.random() * 10),
//         flow_byts_per_sec: flow.flow_byts_per_sec + (Math.random() * 1000 - 500),
//         flow_pkts_per_sec: flow.flow_pkts_per_sec + (Math.random() * 5 - 2.5),
//       }))
//       setData(newData)

//       setTimeSeriesData(prevData => [
//         ...prevData,
//         {
//           time: new Date().toLocaleTimeString(),
//           totalPackets: newData.reduce((sum, flow) => sum + flow.tot_fwd_pkts, 0),
//           totalBytes: newData.reduce((sum, flow) => sum + flow.flow_byts_per_sec, 0)
//         }
//       ].slice(-20)) // Keep only the last 20 data points
//     }, 1000)

//     return () => clearInterval(interval)
//   }, [data])

// useEffect(() => {
//     async function fetchResponse() {
//       try {
//         const res = await axios.get("http://localhost:8000/collect-data?duration=30");
//         const fetchedData = res.data; // Assuming this is in the format of initialData
//         setData(fetchedData);
        
//         // Update time series data
//         setTimeSeriesData(prevData => [
//           ...prevData,
//           {
//             time: new Date().toLocaleTimeString(),
//             totalPackets: fetchedData.reduce((sum, flow) => sum + flow.tot_fwd_pkts, 0),
//             totalBytes: fetchedData.reduce((sum, flow) => sum + flow.flow_byts_per_sec, 0),
//           }
//         ].slice(-20)); // Keep only the last 20 data points

//       } catch (error) {
//         console.error("Error fetching data: ", error);
//       }
//     }

//     // Fetch data initially
//     fetchResponse();

//     // Set interval to fetch data every 60 seconds
//     const interval = setInterval(fetchResponse, 60000);

//     // Cleanup interval on component unmount
//     return () => clearInterval(interval);
//   }, []);

useEffect(() => {
    const interval = setInterval(() => {
        const newData = data.map(flow => ({
            ...flow,
            tot_fwd_pkts: flow.tot_fwd_pkts + Math.floor(Math.random() * 10),
            flow_byts_per_sec: flow.flow_byts_per_sec + (Math.random() * 1000 - 500),
            flow_pkts_per_sec: flow.flow_pkts_per_sec + (Math.random() * 5 - 2.5),
        }));
        setData(newData);

        setTimeSeriesData(prevData => [
            ...prevData,
            {
                time: new Date().toLocaleTimeString(),
                totalPackets: newData.reduce((sum, flow) => sum + flow.tot_fwd_pkts, 0),
                totalBytes: newData.reduce((sum, flow) => sum + flow.flow_byts_per_sec, 0)
            }
        ].slice(-20)); // Keep only the last 20 data points
    }, 1000);

    // Fetch data initially and then every 60 seconds
    const fetchResponse = async () => {
        try {
            const res = await axios.get("http://localhost:8000/collect-data?duration=60");
            const fetchedData = res.data; // Assuming this is in the format of initialData
            setData(fetchedData); // Update data with fetched data

            // Update time series data
            setTimeSeriesData(prevData => [
                ...prevData,
                {
                    time: new Date().toLocaleTimeString(),
                    totalPackets: fetchedData.reduce((sum, flow) => sum + flow.tot_fwd_pkts, 0),
                    totalBytes: fetchedData.reduce((sum, flow) => sum + flow.flow_byts_per_sec, 0),
                }
            ].slice(-20)); // Keep only the last 20 data points

        } catch (error) {
            console.error("Error fetching data: ", error);
        }
    };

    fetchResponse(); // Fetch data initially

    const fetchInterval = setInterval(fetchResponse, 60000); // Fetch data every 60 seconds

    return () => {
        clearInterval(interval);
        clearInterval(fetchInterval); // Cleanup fetch interval on unmount
    };
}, [data]);


  const getFlowStatus = (flow) => {
    if (flow.flow_byts_per_sec > 150000) return 'critical'
    if (flow.flow_byts_per_sec > 100000) return 'alert'
    return 'normal'
  }

  const totalPackets = data.reduce((sum, flow) => sum + flow.tot_fwd_pkts, 0)
  const averageFlowDuration = data.reduce((sum, flow) => sum + flow.flow_duration, 0) / data.length
  const protocolDistribution = data.reduce((acc, flow) => {
    acc[flow.protocol] = (acc[flow.protocol] || 0) + 1
    return acc
  }, {})

  const topSources = data
    .sort((a, b) => b.flow_byts_per_sec - a.flow_byts_per_sec)
    .slice(0, 5)

    return (
        <div className=" w-full max-w-6xl py-10 h-full bg-gradient-to-br from-gray-900 to-gray-800 min-h-screen text-white">
          <h1 className="text-4xl font-bold mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Network Flow Dashboard</h1>
          

          {/* Top Sources Table */}
          <Card className="mb-8 bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-100">Top 5 Sources by Bytes/s</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-gray-300">Source IP</TableHead>
                    <TableHead className="text-gray-300">Destination IP</TableHead>
                    <TableHead className="text-gray-300">Bytes/s</TableHead>
                    <TableHead className="text-gray-300">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topSources.map((flow, index) => (
                    <TableRow key={index} className="hover:bg-white hover:bg-opacity-5">
                      <TableCell className="font-medium text-gray-200">{flow.src_ip}</TableCell>
                      <TableCell className="text-gray-300">{flow.dst_ip}</TableCell>
                      <TableCell className="text-gray-300">{flow.flow_byts_per_sec.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={getFlowStatus(flow) === 'normal' ? 'default' : 'destructive'}
                          className={`
                            ${getFlowStatus(flow) === 'normal' ? 'bg-green-500 hover:bg-green-600' : ''}
                            ${getFlowStatus(flow) === 'alert' ? 'bg-yellow-500 hover:bg-yellow-600' : ''}
                            ${getFlowStatus(flow) === 'critical' ? 'bg-red-500 hover:bg-red-600' : ''}
                          `}
                        >
                          {getFlowStatus(flow).toUpperCase()}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>


          {/* Flow Overview Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium">Total Packets</CardTitle>
                <Activity className="h-6 w-6 text-purple-200" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{totalPackets.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium">Average Flow Duration</CardTitle>
                <Clock className="h-6 w-6 text-cyan-200" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{averageFlowDuration.toFixed(2)}s</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-emerald-500 to-green-600 text-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium">Active Flows</CardTitle>
                <Database className="h-6 w-6 text-emerald-200" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{data.length}</div>
              </CardContent>
            </Card>
          </div>
    
          {/* Time Series Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card className="bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-100">Total Packets Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={timeSeriesData}>
                    <XAxis dataKey="time" stroke="#A0AEC0" />
                    <YAxis stroke="#A0AEC0" />
                    <Tooltip contentStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.8)', border: 'none' }} />
                    <Line type="monotone" dataKey="totalPackets" stroke="#8B5CF6" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card className="bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-100">Total Bytes Transferred Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={timeSeriesData}>
                    <XAxis dataKey="time" stroke="#A0AEC0" />
                    <YAxis stroke="#A0AEC0" />
                    <Tooltip contentStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.8)', border: 'none' }} />
                    <Area type="monotone" dataKey="totalBytes" stroke="#4FD1C5" fill="url(#colorBytes)" fillOpacity={0.3} />
                    <defs>
                      <linearGradient id="colorBytes" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4FD1C5" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#4FD1C5" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
    
          {/* Protocol Distribution */}
          <Card className="mb-8 bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-100">Protocol Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={Object.entries(protocolDistribution).map(([key, value]) => ({ name: key, value }))}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {Object.entries(protocolDistribution).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.8)', border: 'none' }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
    
          {/* Flow Performance Metrics */}
          <Card className="bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-100">Flow Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#A0AEC0" />
                  <XAxis dataKey="src_ip" stroke="#A0AEC0" />
                  <YAxis yAxisId="left" orientation="left" stroke="#8B5CF6" />
                  <YAxis yAxisId="right" orientation="right" stroke="#4FD1C5" />
                  <Tooltip contentStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.8)', border: 'none' }} />
                  <Bar yAxisId="left" dataKey="flow_byts_per_sec" fill="#8B5CF6" name="Bytes/s" />
                  <Bar yAxisId="right" dataKey="flow_pkts_per_sec" fill="#4FD1C5" name="Packets/s" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )
    }