import React from 'react';

import { makeStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import Slider from '@material-ui/core/Slider';
import Input from '@material-ui/core/Input';
import CheckBox from '@material-ui/core/Checkbox';

import Backdrop from '@material-ui/core/Backdrop';
import CircularProgress from '@material-ui/core/CircularProgress';

const useStyles = makeStyles({
  root: {
    width: 250,
    paddingLeft: 20,
    paddingRight: 20,
    textAlign: 'left'
  },
  input: {
    width: 50,
    background: 'white'
  },
});

const useStyles_Backdrop = makeStyles((theme) => ({
  backdrop: {
    zIndex: theme.zIndex.drawer + 1,
    color: '#fff',
  },
}));
  
export function MySlider(props) {
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
      <Typography variant='caption' id="input-slider" gutterBottom>
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

export function MyCheckbox(props) {
  const classes = useStyles();
  const [checked, setChecked] = React.useState(props.default);

  const handleCheckboxChange = (event) => {
    setChecked(event.target.checked);
    props.handleCheckboxChange(event, props.tag);
  };

  return(
    <div className={classes.root}>
      <Typography variant='caption' id="bool-param" gutterBottom>
        {props.tag}
      </Typography>
      <Grid container spacing={2} alignItems="center">
        <Grid item>
          <CheckBox 
            color='primary'
            checked={checked} 
            onChange={handleCheckboxChange} 
            inputProps={ {'aria-label': 'bool-param'} }
          />
        </Grid>
      </Grid>
    </div>
  );
}

export function LoadBackdrop(props) {
  const classes = useStyles_Backdrop();

  return(
    <div>
      <Backdrop className={classes.backdrop} open={props.open}>
        <CircularProgress color="inherit" />
      </Backdrop>
    </div>
  ); 
}