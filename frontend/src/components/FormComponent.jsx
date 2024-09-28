import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bounce, toast } from 'react-toastify';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"


const FormComponent = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    aadhaar: '',
    eid: '',
    fathers_name: '',
    phone: ''
  });
  const [events, setEvents] = useState([]);
  const [mousemoveCount, setMousemoveCount] = useState(0);
  const [keypressCount, setKeypressCount] = useState(0);

  // Function to handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Function to handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    console.log('Captured events:', events);

    const payload = {
      mouseMoveCount: mousemoveCount,
      keyPressCount: keypressCount,
      events: events
    };

    try {
      const res = await fetch('http://127.0.0.1:5000/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify(payload),
      });

      const res2 = await res.json();
      console.log('API response:', res2);

      // Check bot prediction from the response
      if (res2.prediction[0].bot === false) {
        toast.success('Form submitted successfully!', {
          position: 'top-right',
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          transition: Bounce,
        });
      } else if (res2.prediction[0].bot === true) {
        navigate('/verify');
      }

      // Save user data in local storage
      const { ip_address, user_agent, current_timestamp, prediction } = res2[0];
      const newUser = {
        ipAddress: ip_address,
        userAgent: user_agent,
        timestamp: current_timestamp,
        mouseMoveCount: mousemoveCount,
        keyPressCount: keypressCount,
        isBot: prediction.bot,
      };

      const savedUsers = JSON.parse(localStorage.getItem('users')) || [];
      savedUsers.push(newUser);
      localStorage.setItem('users', JSON.stringify(savedUsers));
      console.log('user ', newUser);

    } catch (error) {
      console.error('Error submitting event data:', error);
    }
  };

  // Function to capture events
  const captureEvent = (event_name, event) => {
    const eventData = {
      event_name,
      x_position: event.clientX || window.scrollX || 0,
      y_position: event.clientY || window.scrollY || 0,
      timestamp: new Date().getTime(),
    };

    if (
      event_name === 'mousemove' ||
      event_name === 'mouseup' ||
      event_name === 'mouseover' ||
      event_name === 'mousedown' ||
      event_name === 'mouseout'
    ) {
      setMousemoveCount((prevCount) => prevCount + 1);
    } else if (
      event_name === 'keypress' ||
      event_name === 'keydown' ||
      event_name === 'keyup'
    ) {
      setKeypressCount((prevCount) => prevCount + 1);
    }

    setEvents((prevEvents) => {
      const newEvents = [...prevEvents, eventData];
      localStorage.setItem('domEvents', JSON.stringify(newEvents));
      return newEvents;
    });
  };

  useEffect(() => {
    const eventNames = [
      'scroll', 'mousedown', 'mousemove', 'mouseout', 'mouseover', 'mouseup',
      'beforeunload', 'click', 'keydown', 'keypress', 'keyup', 'copy'
    ];

    const eventHandler = (event) => {
      captureEvent(event.type, event);
    };

    eventNames.forEach((eventName) => {
      window.addEventListener(eventName, eventHandler);
    });

    // Cleanup event listeners on component unmount
    return () => {
      eventNames.forEach((eventName) => {
        window.removeEventListener(eventName, eventHandler);
      });
    };
  }, []);

  return (
    <div className="container mx-auto py-10">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Form with Event Data Capture</CardTitle>
          <CardDescription>Please fill out all the required information</CardDescription>
        </CardHeader>
        <CardContent>
          <form id="event-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="fathers_name">Father{"'"}s Name</Label>
                  <Input
                    id="fathers_name"
                    name="fathers_name"
                    value={formData.fathers_name}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="aadhaar">Aadhaar Number (14 digits)</Label>
                  <Input
                    id="aadhaar"
                    name="aadhaar"
                    maxLength={14}
                    pattern="\d{14}"
                    value={formData.aadhaar}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="eid">EID (12 digits)</Label>
                  <Input
                    id="eid"
                    name="eid"
                    maxLength={12}
                    pattern="\d{12}"
                    value={formData.eid}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  type="tel"
                  id="phone"
                  name="phone"
                  pattern="\d{10}"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <button type="submit" onClick={handleSubmit} className="w-full">Submit</button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default FormComponent;
