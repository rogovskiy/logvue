import React, { useState, useEffect } from 'react';
import { Button, Modal, Icon, Input } from 'semantic-ui-react';

const isNumeric = (value) => {
  return /^-?\d+$/.test(value);
};

const GoToLineModal = (props) => {
  const { show, onClose } = props;
  const [gotoSpec, setGotoSpec] = useState('');

  useEffect(() => {
    if (!show) {
      setGotoSpec('');
    }
  }, [show, setGotoSpec]);

  const handleKeys = (e) => {
    const gotoSpec = e.target.value;
    if (e.key === 'ArrowUp') {
      const val =
        gotoSpec[0] === '+' || gotoSpec[0] === '-'
          ? gotoSpec.substring(1)
          : gotoSpec;
      if (isNumeric(val)) {
        setGotoSpec(`-${val}`);
      }
      e.nativeEvent.stopPropagation();
      e.nativeEvent._myCustomBubbleStopper = true; // nothing seems to stop this event from being sent to the document
      e.preventDefault();
    } else if (e.key === 'ArrowDown') {
      const val =
        gotoSpec[0] === '+' || gotoSpec[0] === '-'
          ? gotoSpec.substring(1)
          : gotoSpec;
      if (isNumeric(val)) {
        setGotoSpec(`+${val}`);
      }
      e.nativeEvent.stopPropagation();
      e.nativeEvent._myCustomBubbleStopper = true; // nothing seems to stop this event from being sent to the document
      e.preventDefault();
    } else if (e.key === 'Enter') {
      onClose(gotoSpec); // TODO only valid spec
    }
  };

  const inputChanged = (e) => {
    setGotoSpec(e.target.value);
  };

  return (
    <Modal
      dimmer="inverted"
      size="mini"
      open={show}
      onClose={() => onClose(null)}
    >
      <Modal.Header>Jump To</Modal.Header>
      <Modal.Content>
        <Input
          onKeyDown={handleKeys}
          autoFocus
          size="huge"
          placeholder="e.g 12021, +100, -100"
          value={gotoSpec}
          onChange={inputChanged}
        />
      </Modal.Content>
      <Modal.Actions>
        <Button positive onClick={() => onClose(gotoSpec)}>
          Jump
        </Button>
        <div
          className="ui"
          style={{
            padding: '0.75em',
            textAlign: 'left',
            width: '70%',
            float: 'left',
          }}
        >
          TIP: <Icon name="long arrow alternate up" /> /{' '}
          <Icon name="long arrow alternate down" /> - relative jump
        </div>
      </Modal.Actions>
    </Modal>
  );
};

export default GoToLineModal;
