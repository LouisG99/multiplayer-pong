import React, { useState, useEffect } from 'react';
import { Route, Switch, HashRouter } from "react-router-dom";

import logo from './logo.svg';
import './App.css';
import Navigation from './Navigation';
import Landing from './Landing';
import PongInterface from './PongInterface';
import GameManager from './GameManager';
import Matchmaker from './Matchmaker';

function App() {
  
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
                startBall: [0.5, 0.0],
                initBallSpeed: [-0.0005, 0.0], 
                lengthPlayer: 0.12, 
                playerSpeed: 0.02, 
                ballSize: 0.025, 
                playerIndex: 0
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
