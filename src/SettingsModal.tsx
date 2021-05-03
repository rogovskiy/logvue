/* eslint-disable jsx-a11y/label-has-associated-control */
import React, { useState, useEffect } from 'react';
import { Button, Modal, Header, Form, Select, Input } from 'semantic-ui-react';
import { DateTime } from 'luxon';
import { useFileContext } from './FileStateProvider';
import { validateRegex } from './ui-utils';
import { ParserOptionsT } from './types';
import DateFormatPopup from './DateFormatPopup';

const formatDate = (formatStr: string, datetime: DateTime): string => {
  if (formatStr === 'ISO') {
    return datetime.toISO();
  }
  if (formatStr === 'RFC822') {
    return datetime.toRFC2822();
  }
  if (formatStr === 'Unix') {
    return Math.round(datetime.toSeconds()).toString();
  }
  if (formatStr === 'Millis') {
    return datetime.toMillis().toString();
  }
  return datetime.toFormat(formatStr);
};

const SettingsModal = ({ show, onClose }) => {
  const fileState = useFileContext().state;
  const [settings, setSettings] = useState<ParserOptionsT>(
    fileState.parserOptions
  );
  const [bufferSize, setBufferSize] = useState('');
  const [tsSelect, setTsSelect] = useState('ISO');
  const [customFormat, setCustomFormat] = useState('');

  useEffect(() => {
    if (!show) {
      setSettings(fileState.parserOptions);
      setBufferSize(fileState.parserOptions.bufferSize.toString());
      if (fileState.parserOptions.dateFormat) {
        if (
          ['ISO', 'RFC822', 'Unix', 'Millis'].indexOf(
            fileState.parserOptions.dateFormat
          ) >= 0
        ) {
          setTsSelect(fileState.parserOptions.dateFormat);
        } else {
          setTsSelect('custom');
          setCustomFormat(fileState.parserOptions.dateFormat);
        }
      } else {
        setTsSelect('ISO');
      }
    }
  }, [show, setSettings, fileState.parserOptions]);

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
  const validTimePattern = settings.textOptions.timestampPattern
    ? validateRegex(settings.textOptions.timestampPattern)
    : { valid: true, error: null };

  const getDateFormat = () => {
    return tsSelect === 'custom' ? customFormat : tsSelect;
  };

  const submitForm = () => {
    settings.bufferSize = parseInt(bufferSize, 10) || 1000;
    settings.dateFormat = getDateFormat();
    onClose(settings);
  };

  const updateTsSelect = (_e, item) => {
    setTsSelect(item.value);
  };

  const exampleDate = formatDate(getDateFormat(), DateTime.now());

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
          <Form.Checkbox
            label="Extract key-value data"
            checked={settings.textOptions.extractKeyValue}
            onChange={() =>
              updateTextOptionsField(
                'extractKeyValue',
                !settings.textOptions.extractKeyValue
              )
            }
          />
          <Form.Group widths="equal">
            <Form.Input
              fluid
              label="Timestamp Regular Expression"
              placeholder="Regex"
              value={settings.textOptions.timestampPattern}
              error={
                !validTimePattern.valid
                  ? { content: validTimePattern.error, pointing: 'above' }
                  : null
              }
              onChange={(e) =>
                updateTextOptionsField('timestampPattern', e.target.value)
              }
            />
            <Form.Field>
              <label>Timestamp Format</label>
              <Select
                options={[
                  { key: 'iso', value: 'ISO', text: 'ISO-8601' },
                  { key: 'rfc', value: 'RFC822', text: 'RFC-822' },
                  { key: 'unix', value: 'Unix', text: 'Unix' },
                  { key: 'ms', value: 'Millis', text: 'Milliseconds' },
                  { key: 'custom', value: 'custom', text: 'Custom' },
                ]}
                value={tsSelect}
                onChange={updateTsSelect}
              />
              {tsSelect === 'custom' && (
                <Input>
                  <input
                    placeholder="Date format"
                    style={{
                      borderBottomRightRadius: 0,
                      borderTopRightRadius: 0,
                    }}
                    value={customFormat}
                    onChange={(e) => {
                      setCustomFormat(e.target.value);
                    }}
                  />
                  <DateFormatPopup />
                </Input>
              )}
              <small>
                Example: <code>{exampleDate}</code>
              </small>
            </Form.Field>
          </Form.Group>

          <Header size="small">JSON Parsing</Header>
          <Form.Group widths="equal">
            <Form.Input
              fluid
              label="Timestamp Field"
              placeholder="Default: @timestamp"
              value={settings.jsonOptions.timestamp}
              onChange={(e) =>
                updateJsonOptionsField('timestamp', e.target.value)
              }
            />
            <Form.Input
              fluid
              label="Message Field"
              placeholder="Default: message"
              value={settings.jsonOptions.message}
              onChange={(e) =>
                updateJsonOptionsField('message', e.target.value)
              }
            />
          </Form.Group>
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
