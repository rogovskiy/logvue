import React, { FunctionComponent, useState, useEffect } from 'react';
import { Chart } from 'react-charts';

import { ipcRenderer } from 'electron';
import { Icon, Message } from 'semantic-ui-react';
import { DateTime } from 'luxon';
import { ParserOptionsT } from './types';

type HistogramProps = {
  height: string;
  path: string;
  parserOptions: ParserOptionsT;
};

const NUMBER_OF_BUCKETS = 100;

const toJSDate = (dt: DateTime) => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return new DateTime(dt).set({ millisecond: 0 }).toJSDate();
};

const Histogram: FunctionComponent<HistogramProps> = ({
  height,
  path,
  parserOptions,
}) => {
  const [histogramData, setHistogramData] = useState<
    { startTime: DateTime; value: number }[] | null
  >(null);

  useEffect(() => {
    const loadHist = async () => {
      const histData = await ipcRenderer.invoke(
        'get-histogram',
        path,
        NUMBER_OF_BUCKETS,
        parserOptions
      );
      console.log(histData);
      setHistogramData(histData || []);
    };
    loadHist();
  }, [path, parserOptions, setHistogramData]);

  const data = React.useMemo(
    () =>
      histogramData && [
        {
          label: 'Lines',
          data: histogramData.map((h) => ({
            primary: toJSDate(h.startTime),
            secondary: h.value || 0,
          })),
          // data: [
          //   { primary: new Date(2010,10,10, 12, 30, 0), secondary: 21 },
          //   { primary: new Date(2010,10,10, 12, 50, 0), secondary: 12 },
          //   { primary: new Date(2010,10,10, 12, 54, 0), secondary: 43 }
          // ]
        },
      ],
    [histogramData]
  );
  const series = React.useMemo(
    () => ({
      type: 'bar',
      showPoints: false,
    }),
    []
  );
  const axes = React.useMemo(() => {
    if (!histogramData || histogramData.length === 0) {
      return null;
    }
    return [
      {
        primary: true,
        type: 'time',
        position: 'bottom',
        show: false,
        showGrid: false,
        hardMin: toJSDate(histogramData[0].startTime),
        hardMax: toJSDate(histogramData[histogramData.length - 1].startTime),
      },
      { type: 'linear', position: 'left', show: false, showGrid: false },
    ];
  }, [histogramData]);
  if (histogramData === null) {
    return <div />; // loading
  }
  if (histogramData.length === 0) {
    return (
      <Message info size="mini" icon>
        <Icon name="clock" />
        <Message.Content>
          <Message.Header>
            Histogram view is unable to render due to lack of the timestamp
            infomration.
          </Message.Header>
          <p>Review timestamp extraction properties in Settings.</p>
        </Message.Content>
      </Message>
    );
  }
  return (
    <Chart style={{ height }} data={data} series={series} axes={axes} tooltip />
  );
};

export default Histogram;
