import React from 'react';
import { Form, Dropdown } from 'semantic-ui-react';

const labelClickOptions = [
  { key: 1, text: 'Message Field', value: 'message' },
  { key: 2, text: 'Timestamp Field', value: 'timestamp' },
  { key: 3, text: 'Stacktrace Field', value: 'stacktrace' },
];

const TS_COLOR = '#e0e0ff';
const MSG_COLOR = '#ffe0e0';

const JsonSettingsPanel = ({ jsonOptions, updateJsonOptionsField }) => {
  const a;
  return (
    <>
      <Form.Group widths="equal">
        <Form.Input
          fluid
          label="Timestamp Field"
          placeholder="Default: @timestamp"
          value={jsonOptions.timestamp}
          onChange={(e) => updateJsonOptionsField('timestamp', e.target.value)}
        />
        <Form.Input
          fluid
          label="Message Field"
          placeholder="Default: message"
          value={jsonOptions.message}
          onChange={(e) => updateJsonOptionsField('message', e.target.value)}
        />
        <Form.Input
          fluid
          label="Stacktrace"
          placeholder="Default: stacktrace"
          value={jsonOptions.stacktrace}
          onChange={(e) => updateJsonOptionsField('stacktrace', e.target.value)}
        />
      </Form.Group>
      <Header>Additional Fields</Header>
      <Form.Group inline>
        <div style={{ whiteSpace: 'normal' }}>
          {jsonOptions.fields.map((f) => (
            <div
              key={`field_${f}`}
              className="ui mini button"
              style={{
                marginBottom: '5px',
                border: '1px solid gray',
                backgroundColor:
                  // eslint-disable-next-line no-nested-ternary
                  jsonOptions.message === f
                    ? MSG_COLOR
                    : jsonOptions.timestamp === f
                    ? TS_COLOR
                    : 'white',
              }}
            >
              <Dropdown
                text={f}
                options={labelClickOptions}
                simple
                item
                style={{
                  whiteSpace: 'nowrap',
                }}
                onChange={(_e, v) => updateJsonOptionsField(v.value, f)}
              />
            </div>
          ))}
        </div>
      </Form.Group>
    </>
  );
};

export default JsonSettingsPanel;
