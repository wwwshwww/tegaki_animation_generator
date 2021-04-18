import logo from './logo.svg';
import './App.css';
import React from 'react';

const SIZE_LIMIT = (1024 ** 2) * 8

class Uploader extends React.Component{
  constructor(props){
    super(props);
    this.state = {file: ''};
    this.fileInput = React.createRef();
    this.handleChange = this.handleChange.bind(this);
  }
  
  handleChange(event){
    event.preventDefault();
    let file = event.target.files[0]
    if (event.target.files.length === 0){ return; }
    if (file.size > SIZE_LIMIT){
      alert(
        `Over the file upload size limit - '${file.name}'`
      );
      this.setState({value: '', previewUrl: ''})
    }else{
      let reader = new FileReader()
      reader.onloadend = () => {
        this.setState({file: file, previewUrl: reader.result});
      }
      reader.readAsDataURL(file)
    }
  }

  render() {
    return (
      <div>
        <label>
          Image:<br />
          <input 
            type='file' 
            id='input' 
            accept="image/png, image/jpeg" 
            value={this.state.value} 
            ref={this.fileInput} 
            onChange={this.handleChange} 
          />
          <br/>
          <img src={this.state.previewUrl} className='preview' />
        </label>
      </div>
    );
  }
}

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <Uploader />
      </header>
    </div>
  );
}

export default App;
