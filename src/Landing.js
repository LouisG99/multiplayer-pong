import React, { useState, useEffect } from 'react';

function Login() {
  async function handleLoginSubmit() {
    const rawResponse = await fetch('/api/login_user', {
      method: 'post', 
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({a: 1, b: 'Textual content'})
    })

    const content = await rawResponse.json();
    console.log(content);
    alert('Login submitted');
  }

  return(
    <div>
      <input type="text" placeholder="Username" required/>
      <input type="psw" placeholder="Password" required/>
      <button onClick={handleLoginSubmit}>Submit</button>
    </div>
  )
}


function Landing() {
  return (
    <>
      <h2>Hello, welcome to the landing page</h2>
      <Login/>
    </>
  )
}

export default Landing;