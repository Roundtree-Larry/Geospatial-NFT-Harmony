import React, { Component } from "react";
import Identicon from 'identicon.js';
class Navbar extends Component {
  render() {
    return (
      <nav className="navbar hm-gradient shadow ">
        {!this.props.account ? (
          <div
            id="loader"
            className="spinner-border text-light"
            role="status"
          ></div>
        ) : (

            
          <div className="navbar-custom container-fluid ">
            <div className="navbar-brand">
            <img 
              src= {"https://i.imgur.com/IbOtwfk.png"}
              width="50"
              height="45"
              alt=""
            ></img>
            <h6 style={{ color: "white" }}>Geospatial-NFT</h6></div>
            <a
              className="text-white me-2 navbar-toggle"
              href={"https://explorer.pops.one/#/address/" + this.props.account}
              target="_blank"
              rel="noopener noreferrer"
            >
           <h6>
               <img
                width='40'
                height='40'
                src={`data:image/png;base64,${new Identicon(this.props.account, 30).toString()}`}
                alt=""
              />
                  {  " "+this.props.account}
                  </h6>
            </a>
            &nbsp;
          </div>
        )}
      </nav>
    );
  }
}

export default Navbar;
