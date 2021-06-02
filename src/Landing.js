import React, { useState, useEffect } from 'react';
import { sendPostRequest, sendGetRequest } from './utility';


import  { GameCreator } from './GameLink';
import { PlayerArc } from './GameObjects';

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
  // TODO: test

  // let leftXLimit = 0.05, topYLimit = 0;
  // let borderLimits = [
  //   leftXLimit, topYLimit, leftXLimit, 1.0-topYLimit,
  //   1.0-leftXLimit, topYLimit, 1.0-leftXLimit, 1.0-topYLimit
  // ];

    // let gameConfig = {
    //   'startBall': [0.5, 0.5],
    //   // # 'initBallSpeed': [-0.0001, 0.0], 
    //   'initBallSpeed': [0.0, 0.0], 
    //   'lengthPlayer': 0.12, 
    //   // # 'lengthPlayer': 1.0, 
    //   'playerSpeed': 0.8, 
    //   'ballSize': 0.025,
    //   'playerIndex': 0,
    //   'numPlayers': 5
    // };



  // let playerArcs = [];
  // let [xCenter, yCenter, innerRadius] = getCircleParams([50, 50, 400, 400]);
  // for (var i = 0; i < gameConfig.numPlayers; i++) {
  //   playerArcs.push(
  //     <PlayerArc
  //       isLocalPlayer={gameConfig.playerIndex === i}
  //       x={xCenter}
  //       y={yCenter}
  //       innerRadius={innerRadius}
  //       rotation={players.angles[i]}
  //       anglePlayer={players.playerAngle}
  //       angleBoundary={players.boundaryAngle}
  //     />
  //   );
  // }


  return (
    <>
      <h2>Hello, welcome to the landing page</h2>
      <Login/>
      <Logout/>
      <SignUp/>
      <GameCreator/>

  {/* <Stage width={window.innerWidth} height={window.innerHeight}>
      <Layer>
        {playerArcs}  
      </Layer>
      </Stage> */}
    </>
  )
}

export default Landing;