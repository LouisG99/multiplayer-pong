import React, { useState, useEffect } from 'react';
import { sendPostRequest, sendGetRequest } from './utility';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  function handleUsernameChange(e) { setUsername(e.target.value) }
  function handlePasswordChange(e) { setPassword(e.target.value) }

  async function handleLoginSubmit() {
    const rawResponse = await sendPostRequest('/api/login', 
      { username: username, password: password}
    );
    
    const content = await rawResponse.json();
    console.log(content);
  }

  return(
    <div>
      <input type="text" placeholder="Username" onChange={handleUsernameChange}/>
      <input type="psw" placeholder="Password" onChange={handlePasswordChange}/>
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
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  function handleUsernameChange(e) { setUsername(e.target.value) }
  function handlePasswordChange(e) { setPassword(e.target.value) }

  async function handleSignupSubmit() {
    const rawResponse = await sendPostRequest('/api/signup', 
      { username: username, password: password }
    );
    
    const content = await rawResponse.json();
    console.log(content);
  }

  return(
    <div>
      <input type="text" placeholder="Username" onChange={handleUsernameChange}/>
      <input type="psw" placeholder="Password" onChange={handlePasswordChange}/>
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