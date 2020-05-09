import React, { useState, useEffect } from 'react';
import { sendPostRequest, sendGetRequest } from './utility';

function Login() {
  async function handleLoginSubmit() {
    const rawResponse = await sendPostRequest('/api/login', 
      { username: 'louis', password: 'louis'}
    );
    
    const content = await rawResponse.json();
    console.log(content);
  }

  return(
    <div>
      <input type="text" placeholder="Username" required/>
      <input type="psw" placeholder="Password" required/>
      <button onClick={handleLoginSubmit}>Login</button>
    </div>
  )
}

function Logout() {
  async function handleLogoutSubmit() {
    const rawResponse = await sendGetRequest('/api/logout');
    const content = await rawResponse.json();
    console.log(content);
  }
  
  return (
    <button onClick={handleLogoutSubmit}>Logout</button>
  )
}

function SignUp() {
  async function handleSignupSubmit() {
    const rawResponse = await sendPostRequest('/api/signup', 
      { username: 'louis', password: 'louis'}
    );
    
    const content = await rawResponse.json();
    console.log(content);
  }

  return(
    <div>
      <input type="text" placeholder="Username" required/>
      <input type="psw" placeholder="Password" required/>
      <button onClick={handleSignupSubmit}>Sign Up</button>
    </div>
  )
}

function Landing() {
  return (
    <>
      <h2>Hello, welcome to the landing page</h2>
      <Login/>
      <Logout/>
      <SignUp/>
    </>
  )
}

export default Landing;