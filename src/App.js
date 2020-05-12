import React, { useState, useEffect } from 'react';
import { Route, Switch, HashRouter, Link } from "react-router-dom";


import logo from './logo.svg';
import './App.css';
import Navigation from './Navigation';
import Landing from './Landing';
import PongInterface from './PongInterface';
import GameManager from './GameManager';
import Matchmaker from './Matchmaker';

function App() {
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    fetch('/time').then(res => res.json()).then(data => {
      setCurrentTime(data.time);
    });
  }, []);

  
  return (
    <div className="App">
      <HashRouter>
        {/* <Route path='/' component={Navigation}/> */}

        <Switch>
          <Route path='/' exact component={Landing}/>
          <Route path='/matchmaker' exact component={Matchmaker}/>
          <Route path='/game' exact component={GameManager}/>


          <Route path='/interf_test' exact component={() =>
            <PongInterface
              waitingForPlayer={false}
              gameConfig={{
                startBall: [300, 100],
                initBallSpeed: [0, 0], 
                lengthPlayer: 100, 
                playerSpeed: 20, 
                ballSize: 50, 
                playerIndex: 1
              }}
              />}
          />

          {/* <Route path='/game' exact component={PongInterface}/> */}
        </Switch>
      </HashRouter>
    </div>
  );
}

export default App;
