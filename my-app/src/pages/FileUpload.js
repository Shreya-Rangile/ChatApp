import React from "react";

const FileUpload = () =>{
    return(
        <div>
            <input type="file" accept="image/*,audio/*,video/*,.doc,.docx,.pdf,.txt"/>
            <button>Send</button>
        </div>
    )
}

export default FileUpload;