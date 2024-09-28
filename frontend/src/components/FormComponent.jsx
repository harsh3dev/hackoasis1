// import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
// import { Bounce, toast } from 'react-toastify';
// import { useDispatch } from 'react-redux';
// import { addUserInformation } from '../slice/userSlice';

const FormComponent = () => {
  // const router = useRouter();

  // const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    aadhaar: '',
    eid: '',
    fathers_name: '',
    phone: ''
  });
  // const users = useSelector((state) => state.user.information);
  const [events, setEvents] = useState([]);
  // const [loading, setLoading] = useState(false);
  const [result, setResult] = useState([{bot: null, reconstruction_error: 0}]);
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
    captureEvent('form_submission', e);
    
    /*
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

        const result = await res.json();
        console.log('API response:', result);
        setResult(result);
      } catch (error) {
        console.error('Error submitting event data:', error);
      }
    */
    // if(result[0].bot===false){
    //   toast.success('Form Submitted Successfully', {
    //     position: "top-center",
    //     autoClose: 5000,
    //     hideProgressBar: false,
    //     closeOnClick: true,
    //     pauseOnHover: true,
    //     draggable: true,
    //     progress: undefined,
    //     theme: "light",
    //     transition: Bounce,
    //   });
    // } else if(result[0].bot===true){
    //   router.push('/verify');
    // Make an API call to send the captured events
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

      const result = await res.json();
      console.log('API response:', result);
      const { ip_address, user_agent, current_timestamp, prediction } = result;

      const newUser={
        ipAddress: ip_address,
        userAgent: user_agent,
        timestamp: current_timestamp,
        mouseMoveCount: mousemoveCount,
        keyPressCount: keypressCount,
        isBot:prediction[0].bot,
      }
      
      // dispatch(addUserInformation(newUser));
      const savedUsers = JSON.parse(localStorage.getItem('users')) || [];
      savedUsers.push(newUser);
      localStorage.setItem('users', JSON.stringify(savedUsers));
      console.log("user ",newUser);
      setResult(result);
    } catch (error) {
      console.error('Error submitting event data:', error);
    }
    
  };



  // const handleDownload = () => {

  //   let csvContent = "data:text/csv;charset=utf-8,";
  //   csvContent += "event_name,timestamp,x_position,y_position\n"; // CSV header

  //   events.forEach(event => {
  //     const row = `${event.eventType},${event.timestamp},${event.x},${event.y}\n`;
  //     csvContent += row;
  //   });

  //   const encodedUri = encodeURI(csvContent);
  //   const link = document.createElement('a');
  //   link.setAttribute('href', encodedUri);
  //   link.setAttribute('download', 'event_data.csv');
  //   document.body.appendChild(link);
  //   link.click();
  //   document.body.removeChild(link);
  // };

  
  useEffect(() => {
    if (result && result.prediction && result.prediction.length > 0) {
      if (result.prediction[0].bot) {
        alert('Bot detected');
      } else if (result.prediction[0].bot === false) {
        alert('User detected');
      }
    } else {
      console.warn('No predictions available'); // Optional: handle cases when there are no predictions
    }
  }, [result]);
  
  // Function to capture events
  const captureEvent = (event_name, event) => {
    const eventData = {
      // element: event.target.tagName || 'window',
      event_name,
      x_position: event.clientX || window.scrollX || 0,
      y_position: event.clientY || window.scrollY || 0,
      timestamp: new Date().getTime(),
    };

    if ((event_name === 'mousemove') || (event_name === 'mouseup') || (event_name === 'mouseover') || (event_name === 'mousedown') || (event_name === 'mouseout')) {
      setMousemoveCount((prevCount) => prevCount + 1);
    } else if ((event_name === 'keypress') || (event_name === 'keydown')  || (event_name === 'keyup') ) {
      setKeypressCount((prevCount) => prevCount + 1);
    }

    setEvents((prevEvents) => {
      const newEvents = [...prevEvents, eventData];
      localStorage.setItem('domEvents', JSON.stringify(newEvents));
      return newEvents;
    });
  };

  
  // const clearEvents = () => {
  //   setEvents([]);
  //   localStorage.removeItem('domEvents');
  // };

  
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
    <div className="p-8 w-full bg-gray-100 h-full grid gap-8 ">
      <h1 className=' w-full text-center font-bold text-3xl '>IEM HackOasis 1.0</h1>
      <div className="w-full h-full flex flex-col justify-start items-start gap-4">
        <div className="bg-white p-6 rounded-md shadow-md w-full">
          <h2 className="text-lg font-medium mb-2">Fill the Form:</h2>
          <form
            id="event-form"
            className="space-y-4 w-full"
            onSubmit={handleSubmit}
          >
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">
                Name:
              </label>
              <input
                type="text"
                id="name"
                name="name"
                className="w-full border rounded-md p-2"
                required
                value={formData.name}
                onChange={handleChange}
              />
            </div>
            <div className=" flex items-center gap-4 ">
              <div className="w-1/2">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium mb-1"
                >
                  Email:
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="w-full border rounded-md p-2"
                  required
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
              <div className="w-1/2">
                <label
                  htmlFor="fathers_name"
                  className="block text-sm font-medium mb-1"
                >
                  Father{"'"}s Name:
                </label>
                <input
                  type="text"
                  id="fathers_name"
                  name="fathers_name"
                  className="w-full border rounded-md p-2"
                  required
                  value={formData.fathers_name}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className="flex gap-4 items-center">
              <div className="w-full">
                <label
                  htmlFor="aadhaar"
                  className="block text-sm font-medium mb-1"
                >
                  Aadhaar Number (14 digits):
                </label>
                <input
                  type="text"
                  id="aadhaar"
                  name="aadhaar"
                  maxLength={14}
                  pattern="\d{14}"
                  className="w-full border rounded-md p-2"
                  required
                  value={formData.aadhaar}
                  onChange={handleChange}
                />
              </div>
              <div className="w-1/2"></div>
              <label htmlFor="eid" className="block text-sm font-medium mb-1">
                EID (12 digits):
              </label>
              <input
                type="text"
                id="eid"
                name="eid"
                maxLength={12}
                pattern="\d{12}"
                className="w-full border rounded-md p-2"
                required
                value={formData.eid}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium mb-1">
                Phone Number:
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                pattern="\d{10}"
                className="w-full border rounded-md p-2"
                required
                value={formData.phone}
                onChange={handleChange}
              />
            </div>

            <button
              type="submit"
              id="submit"
              className="bg-blue-500 text-white py-2 px-4 rounded-md"
            >
              Submit
            </button>
          </form>
        </div>
      </div>

      {/* <div className="bg-white px-6 rounded-md max-h-[35rem] overflow-scroll relative flex flex-col justify-between items-center shadow-md mt-4">
        <h2 className="text-lg font-medium mb-2">Captured Events:</h2>
        <ul className="space-y-2 flex flex-col-reverse ">
          {events.map((event, index) => (
            <li key={index}>
              {`Event Type: ${event.event_name}, X: ${event.x_position}, Y: ${event.y_position}, Timestamp: ${event.timestamp}`}
            </li>
          ))}
        </ul>
        <div className="sticky bottom-0 p-4 bg-white w-full ">
          <div className="flex justify-center items-center gap-4 w-full">
            <button
              onClick={clearEvents}
              id="clear-events"
              className="mt-4 bg-red-500 text-white py-2 px-4 rounded-md"
            >
              Clear Events
            </button>
          </div>
        </div>
      </div> */}
    </div>
  );
}

export default FormComponent;