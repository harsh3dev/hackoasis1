/* eslint-disable no-unused-vars */
import { useEffect, useRef, useState } from 'react';
import './App.css'
import "./lib/slidercaptcha";
import { MdCheckCircle } from 'react-icons/md';
import { Link } from 'react-router-dom';

function Verify() {
  const ref = useRef();
  const captcha = useRef();
  const [keyRender, resetKeyRender] = useState(0);
  const [captchaSuccess, setCaptchaSuccess] = useState(false);

  // const toggleCatpcha = () => {
  //   if (captcha.current) {
  //     captcha.current = null;
  //     resetKeyRender(prev => prev+1);
  //     return;
  //   }

  //   if (ref.current && !captcha.current) {
  //     captcha.current = window.sliderCaptcha(
  //       {
  //           element: ref.current,
  //           loadingText: 'Loading...',
  //           failedText: 'Try again',
  //           barText: 'Slide right to fill',
  //           repeatIcon: 'fa fa-redo',
  //           onSuccess: function () {
  //               setTimeout(function () {
  //                   alert('Your captcha is successfully verified.');
  //                   captcha.current.reset();
  //               }, 1000);
  //           },
  //       })
  //   }
  // }

  useEffect(() =>{
    if (ref.current && !captcha.current) {
      captcha.current = window.sliderCaptcha(
        {
            element: ref.current,
            loadingText: 'Loading...',
            failedText: 'Try again',
            barText: 'Slide right to fill',
            repeatIcon: 'fa fa-redo',
            onSuccess: function () {
                setCaptchaSuccess(true);
                captcha.current.reset();
            },
        })
    }
  }, []);

  return (
    <div className='mt-32 w-full grid place-items-center p-8'>
      {
        captchaSuccess ? <>
          <div className="text-center bg-white p-8 rounded-lg shadow-xl max-w-md w-full mx-4">
        <MdCheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Success!</h1>
        <p className="text-xl text-gray-600 mb-6">
          You have been verified as human. Welcome!
        </p>
        <button className="w-full">
          <Link href="/admin">Return to Home</Link>
        </button>
      </div>
        </> : <div className='w-full space-y-4 items-center'>
          <h1 className=' text-lg my-4 font-bold text-blue-700 text-center '> Please complete this fun task to continue!</h1>
        <div key={keyRender} ref={ref}></div>
      </div>
      }
      
    </div>
  )
}

export default Verify;