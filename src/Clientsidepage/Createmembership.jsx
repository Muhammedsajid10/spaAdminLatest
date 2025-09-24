import React from 'react';
import './Createmembership.css';

const Createmembership = () => {
    return (
        <div className="cm-main">
            <button className="cm-create-btn">Create membership</button>

            <div className="cm-header">
                <h2>Create a membership</h2>
            </div>

            <div className="cm-container">



                <div className="cm-section">
                    <h3 className="cm-section-title">Basic info</h3>
                    <label className="cm-label">Membership name</label>
                    <input className="cm-input" placeholder="Add membership name" />

                    <label className="cm-label">Membership description</label>
                    <div className="cm-char-count">0/360</div>
                    <textarea
                        className="cm-textarea"
                        placeholder="Add membership description"
                        maxLength="360"
                    ></textarea>

                </div>


            </div>

           


            <div className="ss-container">
                <h2 className="ss-title">Services and sessions</h2>
                <p className="ss-subtext">Add the services and sessions included in the membership.</p>


                <label className="ss-label">Included services</label>

                <div className="ss-box">
                    
                    <div className="ss-included">
                        <span>0 services</span>
                        <button className="ss-edit-btn">Edit</button>
                    </div>
                </div>

                <div className="ss-session-row">
                    <div className="ss-select-group">
                        <label>Sessions</label>
                        <select className="ss-dropdown">
                            <option value="limited">Limited</option>
                            <option value="unlimited">Unlimited</option>
                        </select>
                    </div>

                    <div className="ss-input-group">
                        <label>Number of sessions</label>
                        <input type="number" defaultValue={5} className="ss-input" />
                        <p className="ss-info">
                    For recurring memberships, the number of sessions will renew at the beginning of each payment cycle.
                </p>

                        
                    </div>
                </div>

               
            </div>

        </div>
    );
};

export default Createmembership;