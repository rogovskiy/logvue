import React, { useEffect, useState, useRef } from 'react';

import { Input, Button, Icon, Label, Progress } from 'semantic-ui-react';

import { ipcRenderer } from 'electron';
import { useFileContext } from './FileStateProvider';
import { FilterT } from './types';
import { validateRegex } from './ui-utils';

const FilterControls = () => {
  const [filterValue, setFilterValue] = useState<FilterT>({
    query: '',
    matchCase: false,
  });
  const { dispatch, state: fileState } = useFileContext();
  const { showBookmarks, showSearchResults } = fileState.filterView;
  const inputRef = useRef<Input>(null);

  const [progress, setProgress] = useState({ progress: 0, count: 0 });
  const [submitted, setSubmitted] = useState<string | null>(null);

  useEffect(() => {
    setFilterValue({ query: '', matchCase: false });
    setProgress({ progress: 0, count: 0 });
    setSubmitted(null);
  }, [fileState.file.path, setSubmitted, setProgress, setFilterValue]);

  useEffect(() => {
    const progressListener = (_event, inProgress, inCount) => {
      setProgress((current) => ({
        progress: inProgress,
        count: inCount || current.count,
      }));
    };

    ipcRenderer.on('search-progress', progressListener);
    return () => {
      ipcRenderer.removeListener('search-progress', progressListener);
    };
  }, [setProgress]);

  // useEffect(() => {
  //   if (focused > 0 && inputRef.current !== null) {
  //     inputRef.current.focus();
  //     inputRef.current.select();
  //   }
  // }, [focused, inputRef]);

  useEffect(() => {
    const handleKeys = (e) => {
      if (
        e.key === '/' &&
        e.target.nodeName !== 'input' &&
        inputRef.current !== null
      ) {
        inputRef.current.focus();
        inputRef.current.select();
        e.preventDefault();
      }
    };
    document.addEventListener('keydown', handleKeys);
    return () => {
      document.removeEventListener('keydown', handleKeys);
    };
  }, [inputRef]);

  const submitFilter = () => {
    const trimmed = filterValue.query.trim();
    setSubmitted(trimmed);
    setProgress({ progress: 0, count: 0 });
    dispatch({ type: 'set-filter', filter: filterValue });
  };

  const handleReturnKey = (e) => {
    if (e.key === 'Enter') {
      submitFilter();
    }
  };

  const updateFilterValue = (e) => {
    setFilterValue({ ...filterValue, query: e.target.value });
  };

  const updateFilterView = (updates) => {
    dispatch({
      type: 'update-filter-view',
      filterView: { ...fileState.filterView, ...updates },
    });
  };

  const notRounded = {
    borderBottomRightRadius: '0',
    borderTopRightRadius: '0',
    borderBottomLeftRadius: '0',
    borderTopLeftRadius: '0',
    margin: '0',
  };

  const validRegex = validateRegex(filterValue.query);

  const inputStyle: React.CSSProperties = {
    borderBottomLeftRadius: '0',
    borderTopLeftRadius: '0',
  };
  if (!validRegex.valid) {
    inputStyle.color = 'red';
  }

  return (
    <div>
      <Input
        ref={inputRef}
        placeholder="string or regex (hint: press /)"
        fluid
        value={filterValue.query}
        onChange={updateFilterValue}
        onKeyDown={handleReturnKey}
        labelPosition="right"
        disabled={progress.progress > 0}
      >
        <Button.Group>
          <Button
            icon
            onClick={() =>
              updateFilterView({ showSearchResults: !showSearchResults })
            }
            active={showSearchResults}
            style={{ borderBottomLeftRadius: '0', borderTopLeftRadius: '0' }}
            title="Show search results"
          >
            <Icon name="search" size="small" />
          </Button>
          <Button
            icon
            onClick={() => updateFilterView({ showBookmarks: !showBookmarks })}
            active={showBookmarks}
            style={{ borderBottomRightRadius: '0', borderTopRightRadius: '0' }}
            title="Show marked lines"
          >
            <Icon name="bookmark" size="small" />
          </Button>
          <Button
            icon
            onClick={() =>
              setFilterValue({
                ...filterValue,
                matchCase: !filterValue.matchCase,
              })
            }
            active={filterValue.matchCase}
            style={notRounded}
            title="Match case"
          >
            <span style={{ fontSize: '0.8em' }}>Aa</span>
          </Button>
        </Button.Group>
        <input
          style={inputStyle}
          title={validRegex.valid ? '' : validRegex.error}
        />
        {submitted && <Label basic>{progress.count} matches</Label>}
        <Button onClick={submitFilter} style={notRounded}>
          Filter
        </Button>
      </Input>
      {progress.progress > 0 && (
        <Progress percent={progress.progress} attached="bottom" />
      )}
    </div>
  );
};

export default FilterControls;
