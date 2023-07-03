import React from 'react';

const ImagePreviewModal = ({ imageUrls, onClose, onSend }) => {
  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 bg-black flex items-center justify-center">
      

      <button className="absolute top-36 right-56 text-white" onClick={onClose}> Close
      </button>
      

      {/* <div>
        {imageUrls.map((imageUrl, index) => (
          <img key={index} src={imageUrl} alt={`Selected Image ${index}`} className="max-w-full max-h-full" />
        ))}
      </div> */}
      {/* <div >
        <img src={imageUrl} alt="Selected Image" className="max-w-full max-h-full" />
      </div> */}


      <div className="grid grid-cols-3 gap-4">
        {imageUrls.map((imageUrl, index) => (
          <img key={index} src={imageUrl} alt={`Selected Image ${index}`} className="max-w-full max-h-full" />
        ))}
      </div>


      <button className="absolute top-48 right-56 text-white" onClick={onSend}> Send
      </button>
       
    </div>
  );
};

export default ImagePreviewModal;
