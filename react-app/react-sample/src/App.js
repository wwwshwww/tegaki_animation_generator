import './App.css';
import React from 'react';

import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import ArrowRightIcon from '@material-ui/icons/ArrowRight';

import axios from 'axios';

import { MySlider, MyCheckbox, LoadBackdrop } from './components.js';
import { Divider } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

const SIZE_LIMIT = (1024 ** 2) * 8

const PARAMETER = {
  threshold: {default: 210, max: 255, min: 0, step: 1, isIntOnly: true},
  eps: {default: 0.99, max: 1.0, min: 0, step: 0.01, isIntOnly: false},
  size: {default: 4, max: 100, min: 1, step: 1, isIntOnly: true},
  movable: {default: 1.5, max: 100.0, min: 0.0, step: 0.5, isIntOnly: false},
  std: {default: 0.15, max: 1.0, min: 0.0, step: 0.01, isIntOnly: false},
  is_stride: {default: true},
  only_external: {default: false},
  leaves: {default: 20, max: 40, min: 1, step: 1, isIntOnly: true},
  fps: {default: 30, max: 60, min: 1, step: 1, isIntOnly: true}
}

const styles = makeStyles({
  paramCaption: {
    margin: 10
  },
  preview: {
    width: 200,
    height: 'auto', 
    margin: 10
  }
});

function Uploader(props){
  const classes = styles();
  const defaults = {};
  for (let key in PARAMETER){
    defaults[key] = PARAMETER[key]['default'];
  }
  const [file, setFile] = React.useState(null);
  const [base64, setBase64] = React.useState(null);
  const [result, setResult] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [param, setParam] = React.useState(defaults);

  const handleChange = (event) => {
    event.preventDefault();
    const f = event.target.files[0];
    if (event.target.files.length === 0){ return; }
    if (f.size > SIZE_LIMIT){
      alert(`Over the file upload size limit - '${f.name}'`);
      setFile(null);
      setBase64(null);
    }else{
      const reader = new FileReader();
      reader.onloadstart = () => {
        setLoading(true);
      };
      reader.onloadend = () => {
        setFile(f);
        setBase64(reader.result);
        setLoading(false);
      };
      reader.readAsDataURL(f);
    }
  };

  const handleSliderChange = (event, newValue, tag) => {
    setParam({tag: newValue});
  };

  const handleInputChange = (event, tag) => {
    setParam({tag: event.target.value === '' ? 0 : Number(event.target.value)});
  };

  const handleBlur = (tag) => {
    if (PARAMETER[tag]['isIntOnly'] && !Number.isInteger(param[tag])){
      setParam({tag: Math.floor(param[tag])});
    }
    if (param[tag] < PARAMETER[tag]['min']){
      setParam({tag: PARAMETER[tag]['min']});
    } else if (param[tag] > PARAMETER[tag]['max']){
      setParam({tag: PARAMETER[tag]['max']});
    }
  };

  const handleCheckboxChange = (event, tag) => {
    setParam({tag: event.target.checked});
  };

  const genConfigs = ['threshold', 'eps', 'size', 'movable', 'std']
  const genConfigsBool = ['is_stride', 'only_external']
  const aniConfigs = ['leaves', 'fps']
  // const genConfigs = Object.keys(PARAMETER)

  return (
    <div>
      <LoadBackdrop open={loading} />
      <label>
        <input type='file' id='input' accept='image/png, image/jpeg' onChange={handleChange} />
      </label>
      <Grid container spacing={2} alignItems='center' justify="center">
        <Grid item>
          <img src={base64} alt='' className={classes.preview} />
        </Grid>
        <Grid item>
          <ArrowRightIcon />
        </Grid>
        <Grid item>
        <img src={result} alt='' className={classes.preview} />
        </Grid>
      </Grid>
      <Divider />
      <Grid container spacing={2} justify="center">
        <Grid item>
          {/* <Typography gutterBottom variant='caption'> */}
          <Typography gutterBottom className={classes.paramCaption}>
            Momentum Param
          </Typography>
          <Paper>
          {genConfigs.map((v) => (
            <MySlider 
              isIntOnly={PARAMETER[v]['isIntOnly']}
              default={PARAMETER[v]['default']} 
              max={PARAMETER[v]['max']} 
              min={PARAMETER[v]['min']} 
              step={PARAMETER[v]['step']} 
              handleBlur={handleBlur} 
              handleInputChange={handleInputChange} 
              handleSliderChange={handleSliderChange} 
              tag={v} 
              key={v}
            />
          ))}
          {genConfigsBool.map((v) => (
            <MyCheckbox
              default={PARAMETER[v]['default']} 
              handleCheckboxChange={handleCheckboxChange} 
              tag={v} 
              key={v}
            />
          ))}
          </Paper>
        </Grid>
        <Grid item>
          <Typography gutterBottom className={classes.paramCaption}>
            Animation Param
          </Typography>
          <Paper>
          {aniConfigs.map((v) => (
            <MySlider 
              isIntOnly={PARAMETER[v]['isIntOnly']}
              default={PARAMETER[v]['default']} 
              max={PARAMETER[v]['max']} 
              min={PARAMETER[v]['min']} 
              step={PARAMETER[v]['step']} 
              handleBlur={handleBlur} 
              handleInputChange={handleInputChange} 
              handleSliderChange={handleSliderChange} 
              tag={v}
              key={v}
            />
          ))}
          </Paper>
        </Grid>
      </Grid>
    </div>
  );
}

function App() {
  return (
    <div className="App">
      <header className="App-header">
        なんかめっちゃプルプルさせるやつ<br/>
        {/* <small>Let's generate animation having momentum from single image.</small> */}
      </header>
      <Uploader />
    </div>
  );
}

export default App;

// function App() {
//   const [file, setFile] = React.useState();
//   const [fileName, setFileName] = React.useState("");

//   const saveFile = (e) => {
//     setFile(e.target.files[0]);
//     setFileName(e.target.files[0].name);
//   };

//   const uploadFile = async (e) => {
//     const formData = new FormData();
//     formData.append("file", file);
//     formData.append("fileName", fileName);
//     try {
//       const res = await axios.post(
//         "http://localhost:3000/upload",
//         formData
//       );
//       console.log(res);
//     } catch (ex) {
//       console.log(ex);
//     }
//   };

//   return (
//     <div className="App">
//       <input type="file" onChange={saveFile} />
//       <button onClick={uploadFile}>Upload</button>
//     </div>
//   );
// }
