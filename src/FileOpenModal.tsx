import React, { useEffect, useState } from 'react';
import { ipcRenderer } from 'electron';

import { Button, Modal, Form, Header, ButtonGroup } from 'semantic-ui-react';

import { SuggestionT } from './types';
import TextSettingsPanel from './TextSettingsPanel';
import JsonSettingsPanel from './JsonSettingsPanel';

const TS_COLOR = '#e0e0ff';
const MSG_COLOR = '#ffe0e0';

const PreviewLine = ({ line, options }) => {
  const lineText = line.line;
  let processedLine = lineText;
  if (options.message) {
    const messageValue = line[options.message];
    if (messageValue) {
      processedLine = processedLine.replace(
        messageValue,
        `<span style="background-color: ${MSG_COLOR}">${messageValue}</span>`
      );
    }
    const tsValue = line[options.timestamp];
    if (tsValue) {
      processedLine = processedLine.replace(
        tsValue,
        `<span style="background-color: ${TS_COLOR}">${tsValue}</span>`
      );
    }
  }
  return (
    <div
      style={{
        whiteSpace: 'pre-wrap',
        wordWrap: 'break-word',
        fontSize: '0.9e',
      }}
      dangerouslySetInnerHTML={{ __html: processedLine || lineText }}
    />
  );
};

const FileOpenModal = ({ show, onClose, file, parserOptions }) => {
  const [settings, setSettings] = useState<SuggestionT | null>(null);
  const [previewLines2, setPreviewLines] = useState(null);
  const [previewIndex, setPreviewIndex] = useState(0);

  useEffect(() => {
    const loadSuggestions = async () => {
      const { suggestion, previewLines } = await ipcRenderer.invoke(
        'guess-settings',
        file,
        100,
        parserOptions
      );
      setSettings(suggestion);
      setPreviewLines(previewLines);
    };
    loadSuggestions();
  }, [file.path, setSettings, setPreviewLines]);

  const setTextFormat = (format) => {
    if (settings) {
      setSettings({ ...settings, textFormat: format });
    }
  };

  const updateJsonField = (field, value) => {
    if (field === 'message' && settings?.jsonOptions) {
      setSettings({
        ...settings,
        jsonOptions: { ...settings.jsonOptions, message: value },
      });
    }
    if (field === 'timestamp' && settings?.jsonOptions) {
      setSettings({
        ...settings,
        jsonOptions: { ...settings.jsonOptions, timestamp: value },
      });
    }
    if (field === 'stacktrace' && settings?.jsonOptions) {
      setSettings({
        ...settings,
        jsonOptions: { ...settings.jsonOptions, stacktrace: value },
      });
    }
  };

  return (
    <Modal
      dimmer="inverted"
      size="small"
      open={show}
      onClose={() => onClose(null)}
    >
      <Modal.Header>Open File</Modal.Header>
      <Modal.Content>
        {settings && (
          <Form>
            <Form.Group inline>
              <label>Format</label>
              <Form.Radio
                label="Plain Text"
                value="text"
                checked={settings.textFormat === 'text'}
                onChange={() => setTextFormat('text')}
              />
              <Form.Radio
                label="JSON"
                value="json"
                checked={settings.textFormat === 'json'}
                onChange={() => setTextFormat('json')}
              />
            </Form.Group>
            {settings.textFormat === 'text' && (
              <TextSettingsPanel
                textOptions={settings.textOptions}
                updateTextOptionsField={null}
              />
            )}
            {settings.textFormat === 'json' && settings.jsonOptions && (
              <>
                <JsonSettingsPanel
                  jsonOptions={settings.jsonOptions}
                  updateJsonOptionsField={updateJsonField}
                />
              </>
            )}
            <Header>
              Preview
              <ButtonGroup size="mini" color="grey" floated="right" basic>
                <Button
                  onClick={() => setPreviewIndex(Math.max(previewIndex - 1, 0))}
                >
                  {'<'}
                </Button>
                <Button onClick={() => setPreviewIndex(previewIndex + 1)}>
                  {'>'}
                </Button>
              </ButtonGroup>
            </Header>
            {previewLines2 && (
              <PreviewLine
                line={previewLines2[previewIndex % previewLines2.length]}
                options={settings.jsonOptions}
              />
            )}
          </Form>
        )}
      </Modal.Content>
      <Modal.Actions>
        <Button onClick={() => onClose(null)}>Cancel</Button>
        <Button positive onClick={() => onClose(settings)}>
          Continue
        </Button>
      </Modal.Actions>
    </Modal>
  );
};

export default FileOpenModal;
