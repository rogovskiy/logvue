import React from 'react';
import { Popup, Button } from 'semantic-ui-react';

const DateFormatPopup = () => {
  return (
    <Popup
      wide
      hoverable
      on="click"
      size="mini"
      position="left center"
      trigger={
        <Button
          icon="help"
          style={{
            borderBottomLeftRadius: 0,
            borderTopLeftRadius: 0,
          }}
        />
      }
    >
      <Popup.Content>
        <div style={{ height: '400px', overflowY: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Token</th>
                <th style={{ width: '100%' }}>Description</th>
                <th>Example</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>S</td>
                <td>millisecond, no padding</td>
                <td>54</td>
              </tr>
              <tr>
                <td>SSS</td>
                <td>millisecond, padded to 3</td>
                <td>054</td>
              </tr>
              <tr>
                <td>u</td>
                <td>fractional seconds, functionally identical to SSS</td>
                <td>054</td>
              </tr>
              <tr>
                <td>s</td>
                <td>second, no padding</td>
                <td>4</td>
              </tr>
              <tr>
                <td>ss</td>
                <td>second, padded to 2 padding</td>
                <td>04</td>
              </tr>
              <tr>
                <td>m</td>
                <td>minute, no padding</td>
                <td>7</td>
              </tr>
              <tr>
                <td>mm</td>
                <td>minute, padded to 2</td>
                <td>07</td>
              </tr>
              <tr>
                <td>h</td>
                <td>hour in 12-hour time, no padding</td>
                <td>1</td>
              </tr>
              <tr>
                <td>hh</td>
                <td>hour in 12-hour time, padded to 2</td>
                <td>01</td>
              </tr>
              <tr>
                <td>H</td>
                <td>hour in 24-hour time, no padding</td>
                <td>9</td>
              </tr>
              <tr>
                <td>HH</td>
                <td>hour in 24-hour time, padded to 2</td>
                <td>13</td>
              </tr>
              <tr>
                <td>Z</td>
                <td>narrow offset</td>
                <td>+5</td>
              </tr>
              <tr>
                <td>ZZ</td>
                <td>short offset</td>
                <td>+05:00</td>
              </tr>
              <tr>
                <td>ZZZ</td>
                <td>techie offset</td>
                <td>+0500</td>
              </tr>
              <tr>
                <td>ZZZZ</td>
                <td>abbreviated named offset</td>
                <td>EST</td>
              </tr>
              <tr>
                <td>ZZZZZ</td>
                <td>unabbreviated named offset</td>
                <td>Eastern Standard Time</td>
              </tr>
              <tr>
                <td>z</td>
                <td>IANA zone</td>
                <td>America/New_York</td>
              </tr>
              <tr>
                <td>a</td>
                <td>meridiem</td>
                <td>AM</td>
              </tr>
              <tr>
                <td>d</td>
                <td>day of the month, no padding</td>
                <td>6</td>
              </tr>
              <tr>
                <td>dd</td>
                <td>day of the month, padded to 2</td>
                <td>06</td>
              </tr>
              <tr>
                <td>c</td>
                <td>
                  day of the week, as number from 1-7 (Monday is 1, Sunday is 7)
                </td>
                <td>3</td>
              </tr>
              <tr>
                <td>ccc</td>
                <td>day of the week, as an abbreviate localized string</td>
                <td>Wed</td>
              </tr>
              <tr>
                <td>cccc</td>
                <td>day of the week, as an unabbreviated localized string</td>
                <td>Wednesday</td>
              </tr>
              <tr>
                <td>ccccc</td>
                <td>day of the week, as a single localized letter</td>
                <td>W</td>
              </tr>
              <tr>
                <td>L</td>
                <td>month as an unpadded number</td>
                <td>8</td>
              </tr>
              <tr>
                <td>LL</td>
                <td>month as an padded number</td>
                <td>08</td>
              </tr>
              <tr>
                <td>LLL</td>
                <td>month as an abbreviated localized string</td>
                <td>Aug</td>
              </tr>
              <tr>
                <td>LLLL</td>
                <td>month as an unabbreviated localized string</td>
                <td>August</td>
              </tr>
              <tr>
                <td>LLLLL</td>
                <td>month as a single localized letter</td>
                <td>A</td>
              </tr>
              <tr>
                <td>y</td>
                <td>year, unpadded</td>
                <td>2014</td>
              </tr>
              <tr>
                <td>yy</td>
                <td>two-digit year</td>
                <td>14</td>
              </tr>
              <tr>
                <td>yyyy</td>
                <td>four- to six- digit year, pads to 4</td>
                <td>2014</td>
              </tr>
              <tr>
                <td>G</td>
                <td>abbreviated localized era</td>
                <td>AD</td>
              </tr>
              <tr>
                <td>GG</td>
                <td>unabbreviated localized era</td>
                <td>Anno Domini</td>
              </tr>
              <tr>
                <td>GGGGG</td>
                <td>one-letter localized era</td>
                <td>A</td>
              </tr>
              <tr>
                <td>kk</td>
                <td>ISO week year, unpadded</td>
                <td>14</td>
              </tr>
              <tr>
                <td>kkkk</td>
                <td>ISO week year, padded to 4</td>
                <td>2014</td>
              </tr>
              <tr>
                <td>W</td>
                <td>ISO week number, unpadded</td>
                <td>32</td>
              </tr>
              <tr>
                <td>WW</td>
                <td>ISO week number, padded to 2</td>
                <td>32</td>
              </tr>
              <tr>
                <td>o</td>
                <td>ordinal (day of year), unpadded</td>
                <td>218</td>
              </tr>
              <tr>
                <td>ooo</td>
                <td>ordinal (day of year), padded to 3</td>
                <td>218</td>
              </tr>
              <tr>
                <td>q</td>
                <td>quarter, no padding</td>
                <td>3</td>
              </tr>
              <tr>
                <td>qq</td>
                <td>quarter, padded to 2</td>
                <td>03</td>
              </tr>
              <tr>
                <td>D</td>
                <td>localized numeric date</td>
                <td>9/4/2017</td>
              </tr>
              <tr>
                <td>DD</td>
                <td>localized date with abbreviated month</td>
                <td>Aug 6, 2014</td>
              </tr>
              <tr>
                <td>DDD</td>
                <td>localized date with full month</td>
                <td>August 6, 2014</td>
              </tr>
              <tr>
                <td>DDDD</td>
                <td>localized date with full month and weekday</td>
                <td>Wednesday, August 6, 2014</td>
              </tr>
              <tr>
                <td>t</td>
                <td>localized time</td>
                <td>9:07 AM</td>
              </tr>
              <tr>
                <td>tt</td>
                <td>localized time with seconds</td>
                <td>1:07:04 PM</td>
              </tr>
              <tr>
                <td>ttt</td>
                <td>localized time with seconds and abbreviated offset</td>
                <td>1:07:04 PM EDT</td>
              </tr>
              <tr>
                <td>tttt</td>
                <td>localized time with seconds and full offset</td>
                <td>1:07:04 PM Eastern Daylight Time</td>
              </tr>
              <tr>
                <td>T</td>
                <td>localized 24-hour time</td>
                <td>13:07</td>
              </tr>
              <tr>
                <td>TT</td>
                <td>localized 24-hour time with seconds</td>
                <td>13:07:04</td>
              </tr>
              <tr>
                <td>TTT</td>
                <td>
                  localized 24-hour time with seconds and abbreviated offset
                </td>
                <td>13:07:04 EDT</td>
              </tr>
              <tr>
                <td>TTTT</td>
                <td>localized 24-hour time with seconds and full offset</td>
                <td>13:07:04 Eastern Daylight Time</td>
              </tr>
              <tr>
                <td>f</td>
                <td>short localized date and time</td>
                <td>8/6/2014, 1:07 PM</td>
              </tr>
              <tr>
                <td>ff</td>
                <td>less short localized date and time</td>
                <td>Aug 6, 2014, 1:07 PM</td>
              </tr>
              <tr>
                <td>fff</td>
                <td>verbose localized date and time</td>
                <td>August 6, 2014, 1:07 PM EDT</td>
              </tr>
              <tr>
                <td>ffff</td>
                <td>extra verbose localized date and time</td>
                <td>
                  Wednesday, August 6, 2014, 1:07 PM Eastern Daylight Time
                </td>
              </tr>
              <tr>
                <td>F</td>
                <td>short localized date and time with seconds</td>
                <td>8/6/2014, 1:07:04 PM</td>
              </tr>
              <tr>
                <td>FF</td>
                <td>less short localized date and time with seconds</td>
                <td>Aug 6, 2014, 1:07:04 PM</td>
              </tr>
              <tr>
                <td>FFF</td>
                <td>verbose localized date and time with seconds</td>
                <td>August 6, 2014, 1:07:04 PM EDT</td>
              </tr>
              <tr>
                <td>FFFF</td>
                <td>extra verbose localized date and time with seconds</td>
                <td>
                  Wednesday, August 6, 2014, 1:07:04 PM Eastern Daylight Time
                </td>
              </tr>
              <tr>
                <td>X</td>
                <td>unix timestamp in seconds</td>
                <td>1407287224</td>
              </tr>
              <tr>
                <td>x</td>
                <td>unix timestamp in milliseconds</td>
                <td>1407287224054</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Popup.Content>
    </Popup>
  );
};

export default DateFormatPopup;
