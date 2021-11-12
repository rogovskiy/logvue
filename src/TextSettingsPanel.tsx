import React from 'react';
import { Form, Select, Input} from 'semantic-ui-react';

import { DateTime } from 'luxon';
import DateFormatPopup from './DateFormatPopup';
import { validateRegex } from './ui-utils';

const DEFAULT_CUSTOM_FORMAT = 'yyyy-MM-dd';

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

const TextSettingsPanel = ({
  textOptions,
  updateTextOptionsField,
  dateFormat,
  setDateFormat,
}) => {
  const isStandard = ['ISO', 'RFC822', 'Unix', 'Millis'].indexOf(dateFormat);

  const updateTsSelect = (_e, item) => {
    if (item === 'custom') {
      setDateFormat(DEFAULT_CUSTOM_FORMAT);
    } else {
      setDateFormat(item);
    }
  };

  const validTimePattern = textOptions.timestampPattern
    ? validateRegex(textOptions.timestampPattern)
    : { valid: true, error: null };

  const exampleDate = formatDate(dateFormat, DateTime.now());
  return (
    <>
      <Form.Checkbox
        label="Extract key-value data"
        checked={textOptions.extractKeyValue}
        onChange={() =>
          updateTextOptionsField(
            'extractKeyValue',
            !textOptions.extractKeyValue
          )
        }
      />
      <Form.Group widths="equal">
        <Form.Input
          fluid
          label="Timestamp Regular Expression"
          placeholder="Regex"
          value={textOptions.timestampPattern}
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
            value={isStandard ? dateFormat : 'custom'}
            onChange={updateTsSelect}
          />
          {!isStandard && (
            <Input>
              <input
                placeholder="Date format"
                style={{
                  borderBottomRightRadius: 0,
                  borderTopRightRadius: 0,
                }}
                value={dateFormat}
                onChange={(e) => {
                  setDateFormat(e.target.value);
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
      ;
    </>
  );
};

export default TextSettingsPanel;
