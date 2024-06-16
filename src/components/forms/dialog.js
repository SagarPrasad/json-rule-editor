import React from 'react';

const Dialog = ({ open, onClose, children }) => {
    if (!open) return null;

    const dialogOverlayStyle = {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)', /* semi-transparent overlay */
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
    };

    const dialogContentStyle = {
        backgroundColor: '#fff',
        padding: '20px',
        borderRadius: '5px',
        boxShadow: '0 0 10px rgba(0, 0, 0, 0.2)',
        width: '30%',
        height: '30%',
        overflow: 'auto',
        position: 'center',
        justifyContent: 'center',
        alignItems: 'center'
    };

    const closeButtonStyle = {
        position: 'absolute',
        top: '10px',
        right: '10px',
        cursor: 'pointer',
        fontSize: '20px',
        color: '#333'
    };

    return (
        <div style={dialogOverlayStyle}>
            <div style={dialogContentStyle}>
                <span style={closeButtonStyle} onClick={onClose}>×</span>
                {children}
            </div>
        </div>
    );
};

export default Dialog;

