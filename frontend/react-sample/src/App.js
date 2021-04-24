import './App.css';
import React from 'react';

import { Grid, Paper, Typography, Button, Divider, Input } from '@material-ui/core';
import ArrowRightIcon from '@material-ui/icons/ArrowRight';
import { makeStyles } from '@material-ui/core/styles';

import axios from 'axios';

import { MySlider, MyCheckbox, LoadBackdrop } from './components.js';

axios.defaults.headers.post['Content-Type'] = 'application/json;charset=utf-8';
// axios.defaults.headers.post['Access-Control-Allow-Origin'] = 'http://localhost:5000';

const clone = require('rfdc')()

const SIZE_LIMIT = (1024 ** 2) * 8

const PARAMETER = {
  threshold: {default: 210, max: 255, min: 0, step: 1, isIntOnly: true},
  eps: {default: 0.99, max: 1.0, min: 0, step: 0.01, isIntOnly: false},
  size: {default: 4, max: 50, min: 1, step: 1, isIntOnly: true},
  movable: {default: 1.5, max: 50.0, min: 0.0, step: 0.5, isIntOnly: false},
  std: {default: 0.15, max: 1.0, min: 0.0, step: 0.01, isIntOnly: false},
  is_stride: {default: true},
  only_external: {default: false},
  leaves: {default: 10, max: 30, min: 1, step: 1, isIntOnly: true},
  fps: {default: 30, max: 60, min: 1, step: 1, isIntOnly: true}
}

const styles = makeStyles({
  paramCaption: {
    margin: 10,
    textAlign: 'center'
  },
  preview: {
    width: 280,
    height: 'auto', 
    margin: 10
  },
});

const transparent = {
  checkerItem: {
    margin: 20,
    background: 'linear-gradient(45deg, #aaa 25%, transparent 25%, transparent 75%, #aaa 75%), linear-gradient(45deg, #aaa 25%, transparent 25%, transparent 75%, #aaa 75%)',
    backgroundSize: '20px 20px',
    backgroundPosition: '0 0, 10px 10px'
  },
}

const text = {
  title: {
    fontSize: 32,
  },
  subtitle: {
    fontSize: 16,
    paddingBottom: 40
  }
}

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
    const p = clone(param);
    p[tag] = newValue;
    setParam(p);
  };

  const handleInputChange = (event, tag) => {
    const p = clone(param);
    p[tag] = event.target.value === '' ? 0 : Number(event.target.value);
    setParam(p);
  };

  const handleBlur = (tag) => {
    const p = clone(param);
    if (PARAMETER[tag]['isIntOnly'] && !Number.isInteger(param[tag])){
      p[tag] = Math.floor(param[tag]);
    }
    if (p[tag] < PARAMETER[tag]['min']){
      p[tag] = PARAMETER[tag]['min'];
    } else if (param[tag] > PARAMETER[tag]['max']){
      p[tag] = PARAMETER[tag]['max'];
    }
    setParam(p);
  };

  const handleCheckboxChange = (event, tag) => {
    const p = clone(param);
    p[tag] = event.target.checked;
    setParam(p);
  };

  const handleSubmit = () => {
    if (base64 != null){
      setLoading(true);
      const data = {
        image: base64, 
        parameter: param
      };
      // const url = 'http://localhost:5000/api/get_animation';
      const url = 'https://tegaki-animation-generator.herokuapp.com/api/get_animation';
      axios.post(url, data)
        .then(res => {
          setResult('data:image/png;base64,' + res.data.apng);
          setLoading(false);
        })
        .catch((err) => {
          console.log(err);
          setLoading(false);
        });
    }
    
  };

  const genConfigs = ['threshold', 'eps', 'size', 'movable', 'std']
  const genConfigsBool = ['is_stride', 'only_external']
  const aniConfigs = ['leaves', 'fps']
  // const genConfigs = Object.keys(PARAMETER)

  return (
    <div>
      <LoadBackdrop open={loading} />
      <Grid container spacing={1} alignItems='flex-end' justify="center">
        <Grid item>
          <label>
            <Input type='file' color='primary' inputProps={{accept: 'image/png, image/jpeg'}} onChange={handleChange} />
          </label>
        </Grid>
        <Grid item>
          <Button size='small' variant='contained' onClick={handleSubmit} disabled={base64 == null}>
            generate
          </Button>
        </Grid>
      </Grid>
      <Grid container spacing={2} alignItems='center' justify="center">
        <Grid item style={transparent.checkerItem}>
          <img src={base64} alt='' className={classes.preview} />
        </Grid>
        <Grid item>
          <ArrowRightIcon/>
        </Grid>
        <Grid item style={transparent.checkerItem}>
        <img src={result} alt='' className={classes.preview} />
        </Grid>
      </Grid>
      <Grid container spacing={2} justify="center">
        <Grid item>
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
        </Grid>
      </Grid>
    </div>
  );
}

function App() {
  return (
    <div className="App">
      {/* <header className="App-header">
        なんかめっちゃプルプルさせるやつ<br/>
        <small>Let's generate animation having momentum from single image.</small>
      </header> */}
      <Typography variant='h1' gutterBottom style={text.title}>
        手描きあにめーたー
      </Typography>
      <Typography variant='h2' gutterBottom style={text.subtitle}>
        1枚のイラストから手描きっぽいアニメーション（APNG形式）を生成するよ
      </Typography>
      <Uploader />
    </div>
  );
}

export default App;
