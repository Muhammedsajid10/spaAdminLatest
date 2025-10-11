import React from 'react';

export default function LazyLoader() {
  return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh'}}>
      <div style={{textAlign:'center'}}>
        <div style={{width:48,height:48,border:'4px solid #ddd',borderTop:'4px solid #333',borderRadius:'50%',animation:'spin 1s linear infinite',margin:'0 auto'}} />
        <p style={{marginTop:12}}>Loading...</p>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
