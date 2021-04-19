import './App.css';
import React from 'react';

import { makeStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import Slider from '@material-ui/core/Slider';
import Input from '@material-ui/core/Input';
import { Slide } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import ArrowRightIcon from '@material-ui/icons/ArrowRight';

import axios from 'axios'

const SIZE_LIMIT = (1024 ** 2) * 8

const PARAMETER = {
  threshold: {default: 210, max: 255, min: 0, step: 1, isIntOnly: true},
  eps: {default: 0.99, max: 1.0, min: 0, step: 0.01, isIntOnly: false},
  size: {default: 4, max: 100, min: 1, step: 1, isIntOnly: true},
  movable: {default: 1.5, max: 100.0, min: 0.0, step: 0.5, isIntOnly: false},
  std: {default: 0.15, max: 10.0, min: 0.0, step: 0.05, isIntOnly: false},
  is_stride: {default: 1, max: 1, min: 0, step: 1, isIntOnly: true},
  leaves: {default: 20, max: 40, min: 1, step: 1, isIntOnly: true},
  fps: {default: 30, max: 60, min: 1, step: 1, isIntOnly: true}
}

const useStyles = makeStyles({
  root: {
    width: 250,
    paddingLeft: 20,
    textAlign: 'left'
  },
  input: {
    width: 50,
    background: 'white'
  },
});

function MySlider(props) {
  const classes = useStyles();
  const [value, setValue] = React.useState(props.default);

  const handleSliderChange = (event, newValue) => {
    setValue(newValue);
    props.handleSliderChange(event, newValue, props.tag);
  };

  const handleInputChange = (event) => {
    setValue(event.target.value === '' ? '' : Number(event.target.value));
    props.handleInputChange(event, props.tag);
  };

  const handleBlur = () => {
    if (props.isIntOnly && !Number.isInteger(value)){
      setValue(Math.floor(value));
    }
    if (value < props.min){
      setValue(props.min);
    }else if (value > props.max){
      setValue(props.max);
    }
    props.handleBlur(props.tag);
  };

  return(
    <div className={classes.root}>
      <Typography id="input-slider" gutterBottom>
        {props.tag}
      </Typography>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs>
          <Slider
            value={typeof value === 'number' ? value : props.min}
            onChange={handleSliderChange} 
            min={props.min} 
            max={props.max} 
            step={props.step}
            aria-labelledby="input-slider"
          />
        </Grid>
        <Grid item>
          <Input
            className={classes.input}
            value={value}
            margin="dense"
            onChange={handleInputChange}
            onBlur={handleBlur}
            inputProps={{
              step: props.step,
              min: props.min,
              max: props.max,
              type: 'number',
              'aria-labelledby': 'input-slider',
            }}
          />
        </Grid>
      </Grid>
    </div>
  );
}

function PreviewOriginal(props){
  return <img src={props.base64} alt='' className='App-logo preview' />
}

class Uploader extends React.Component{
  constructor(props){
    super(props);
    let defaults = {}
    for (let key in PARAMETER){
      defaults[key] = PARAMETER[key]['default'];
    }
    this.state = {
      file: null, 
      base64: null, 
      value: defaults
    };
    this.fileInput = React.createRef();
    
    this.handleChange = this.handleChange.bind(this);
    this.handleSliderChange = this.handleSliderChange.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleBlur = this.handleBlur.bind(this);
  }
  
  handleChange(event){
    event.preventDefault();
    let file = event.target.files[0]
    if (event.target.files.length === 0){ return; }
    if (file.size > SIZE_LIMIT){
      alert(
        `Over the file upload size limit - '${file.name}'`
      );
      this.setState({file: null, base64: null});
    }else{
      let reader = new FileReader()
      reader.onloadend = () => {
        this.setState({file: file, base64: reader.result});
      }
      reader.readAsDataURL(file)
    }
  }

  handleSliderChange(event, newValue, tag){
    this.setState({value: {tag: newValue}});
  }

  handleInputChange(event, tag){
    this.setState({value: {tag: event.target.value === '' ? 0 : Number(event.target.value)}});
  }

  handleBlur(tag){
    if (PARAMETER[tag]['isIntOnly'] && !Number.isInteger(this.state.value[tag])){
      this.setState({value: {tag: Math.floor(this.state.value[tag])}});
    }
    if (this.state.value[tag] < 0){
      this.setState({value: {tag: 0}});
    } else if (this.state.value[tag] > 210){
      this.setState({value: {tag: 210}});
    }
  }

  render() {
    const genConfigs = ['threshold', 'eps', 'size', 'movable', 'std', 'is_stride']
    const aniConfigs = ['leaves', 'fps']
    // const genConfigs = Object.keys(PARAMETER)
    return (
      <div>
        <label>
          <input type='file' id='input' accept='image/png, image/jpeg' ref={this.fileInput} onChange={this.handleChange} />
        </label>
        <br/>
        <Grid container spacing={2} alignItems="center">
          <Grid item>
            <PreviewOriginal base64={this.state.base64}/>
          </Grid>
          <Grid item>
            <ArrowRightIcon />
          </Grid>
        </Grid>

        <br/>
        <Grid container spacing={2}>
          <Grid item>
            {genConfigs.map((v) => (
              <MySlider 
                isIntOnly={PARAMETER[v]['isIntOnly']}
                default={PARAMETER[v]['default']} 
                max={PARAMETER[v]['max']} 
                min={PARAMETER[v]['min']} 
                step={PARAMETER[v]['step']} 
                handleBlur={this.handleBlur} 
                handleInputChange={this.handleInputChange} 
                handleSliderChange={this.handleSliderChange} 
                tag={v}
              />
            ))}
          </Grid>
          <Grid item>
            {aniConfigs.map((v) => (
              <MySlider 
                isIntOnly={PARAMETER[v]['isIntOnly']}
                default={PARAMETER[v]['default']} 
                max={PARAMETER[v]['max']} 
                min={PARAMETER[v]['min']} 
                step={PARAMETER[v]['step']} 
                handleBlur={this.handleBlur} 
                handleInputChange={this.handleInputChange} 
                handleSliderChange={this.handleSliderChange} 
                tag={v}
              />
            ))}
          </Grid>
        </Grid>
      </div>
    );
  }
}


function App() {
  return (
    <div className="App">
      <header className="App-header">
        なんかめっちゃプルプルさせるやつ
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
