import React from 'react';
import EmojiPicker from 'emoji-picker-react';

const EmojiPickerWrapper = ({ onEmojiClick }) => {
  return (
    <div className="emoji-picker-wrapper">
      <EmojiPicker onEmojiClick={onEmojiClick} />
    </div>
  );
};

export default EmojiPickerWrapper;
