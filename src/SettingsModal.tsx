/* eslint-disable jsx-a11y/label-has-associated-control */
import React, { useState, useEffect } from 'react';
import { Button, Modal, Header, Form } from 'semantic-ui-react';
import { useFileContext } from './FileStateProvider';
import { ParserOptionsT } from './types';
import TextSettingsPanel from './TextSettingsPanel';
import JsonSettingsPanel from './JsonSettingsPanel';

const SettingsModal = ({ show, onClose }) => {
  const fileState = useFileContext().state;
  const [settings, setSettings] = useState<ParserOptionsT>(
    fileState.parserOptions
  );
  const [bufferSize, setBufferSize] = useState('');
  const [dateFormat, setDateFormat] = useState('');

  useEffect(() => {
    if (!show) {
      setSettings(fileState.parserOptions);
      setBufferSize(fileState.parserOptions.bufferSize.toString());
      setDateFormat(fileState.parserOptions.dateFormat);
    }
  }, [show, setSettings, fileState.parserOptions, setDateFormat]);

  const listOfEncodings = [
    { text: 'UTF-8', value: 'utf-8' },
    { text: 'ISO-8859-1', value: 'latin1' },
  ];

  const updateField = (name, val) => {
    setSettings({ ...settings, [name]: val });
  };
  const updateTextOptionsField = (name, val) => {
    setSettings({
      ...settings,
      textOptions: { ...settings.textOptions, [name]: val },
    });
  };
  const updateJsonOptionsField = (name, val) => {
    setSettings({
      ...settings,
      jsonOptions: { ...settings.jsonOptions, [name]: val },
    });
  };
  const selectedEncoding = listOfEncodings.findIndex(
    (i) => i.value === settings.encoding
  );
  console.log('ENC', settings.encoding, selectedEncoding);

  const submitForm = () => {
    settings.bufferSize = parseInt(bufferSize, 10) || 1000;
    settings.dateFormat = dateFormat;
    onClose(settings);
  };


  return (
    <Modal
      dimmer="inverted"
      size="small"
      open={show}
      onClose={() => onClose(null)}
    >
      <Modal.Header>Settings</Modal.Header>
      <Modal.Content>
        <Form>
          <Form.Group widths="equal">
            <Form.Select
              fluid
              label="File Encoding"
              options={listOfEncodings}
              placeholder={listOfEncodings[selectedEncoding].text}
              defaultValue={selectedEncoding}
              onChange={(_e, v) => updateField('encoding', v.value)}
            />
            <Form.Input
              fluid
              label="Buffer Size (bytes)"
              placeholder="Default: 1000"
              value={bufferSize}
              onChange={(e) => setBufferSize(e.target.value)}
              error={
                parseInt(bufferSize, 10) > 0
                  ? null
                  : { content: 'must be a positive number', pointing: 'above' }
              }
            />
            {/* <Form.Input
              fluid
              label="Timezone"
              placeholder="Automatic"
              value=""
            /> */}
          </Form.Group>
          <Header size="small">Plain Text Parsing</Header>
          <TextSettingsPanel
            textOptions={settings.textOptions}
            updateTextOptionsField={updateTextOptionsField}
            dateFormat={settings.dateFormat}
            setDateFormat={setDateFormat}
          />

          <Header size="small">JSON Parsing</Header>
          <JsonSettingsPanel
            jsonOptions={settings.jsonOptions}
            updateJsonOptionsField={updateJsonOptionsField}
          />
        </Form>
      </Modal.Content>
      <Modal.Actions>
        <Button onClick={() => onClose(null)}>Cancel</Button>
        <Button positive onClick={submitForm}>
          Update
        </Button>
      </Modal.Actions>
    </Modal>
  );
};

export default SettingsModal;
