import React, { Component } from 'react';

import {
  AppRegistry,
  AsyncStorage,
  StyleSheet,
  Text,
  View,
  ViewPagerAndroid,
  ListView,
  TouchableHighlight,
  TextInput,
  ToolbarAndroid,
  Vibration,
  BackAndroid
} from 'react-native';

import {
  Avatar,
  Button,
  Card
} from 'react-native-material-design';

const Crypto = require("crypto-js");

import ActionButton from 'react-native-action-button';

import Camera from 'react-native-camera';

import Store from 'react-native-simple-store';

class BookmarkButton extends Component {
  render(){
    let timeout = null;
    let held = false;
    return (
      <TouchableHighlight
        //onPress={() => { this.props.onPress(); }}
        onPressIn={() => { held = false; timeout = window.setTimeout(() => { held = true; }, 1000); }}
        onPressOut={() => {
          if (timeout == null) return;
          if (held){
            this.props.onEdit();
          } else {
            this.props.onPress();
          }
        }}
        underlayColor="white"
        activeOpacity={0.7}>
        <View style={styles.bookmarkButton}>
          <Text style={styles.bookmarkButtonText}>{this.props.text}</Text>
          <Text style={styles.bookmarkButtonLink}>{this.props.link}</Text>
        </View>
      </TouchableHighlight>
    );
  }
}

const isFunction = input => typeof input === 'function';
const renderIf = predicate => elemOrThunk =>
  predicate ? (isFunction(elemOrThunk) ? elemOrThunk() : elemOrThunk) : null;

export default class QrevApp extends Component {
  state = {
    page: 0,
    currentTitle: "",
    currentLink: "",
    currentScanned: true,
    currentAddTitle: "",
    currentAddLink: "",
    rows: null,
    editing: false
    //dataSource: null
  };
  
  lds(){
    return new ListView.DataSource({
      rowHasChanged: (r1, r2) => r1 !== r2
    });
  }
  
  constructor(props){
    super(props);
    
    BackAndroid.addEventListener('hardwareBackPress', () => {
      if (this.state.page != 0){
        this.go(0);
        return true;
      }
      return false;
    });
    
    const ds = this.lds();
    this.state = ({
      rows: [],
      dataSource: ds
    });
    
    Store.get("bookmarks")
      .then(((result) => {
        if (result){
          const rows = JSON.parse(result).data;
          this.setState({
            rows: rows,
            dataSource: ds.cloneWithRows(rows)
          });
        }
      }).bind(this));
  }
  
  showLink(title, link){
    this.setState({
      currentTitle: title,
      currentLink: link,
      currentScanned: false
    });
    this.go(2);
  }
  
  editLink(title, link){
    this.setState({
      editing: true,
      currentTitle: title,
      currentLink: link,
      currentAddTitle: title,
      currentAddLink: link
    });
    this.go(1);
  }
  
  go = (page) => {
    this.viewPager.setPage(page);
    this.setState({
      page: page
    });
  };
  
  render(){
    return (
      <ViewPagerAndroid
        style={styles.viewPager}
        initialPage={0}
        scrollEnabled={false}
        ref={viewPager => { this.viewPager = viewPager; }}>
        <View style={styles.view}>
          <ToolbarAndroid
            style={styles.header}
            title="Manage your bookmarks"
            titleColor="rgba(255, 255, 255, .9)"
            />
          <ListView
            dataSource={this.state.dataSource}
            renderRow={(rowData) => {
              return <BookmarkButton
                onPress={() => { this.showLink(rowData[0], rowData[1]); }}
                onEdit={() => { this.editLink(rowData[0], rowData[1]); }}
                text={rowData[0]}
                link={rowData[1]}/>; }}
            />
          <ActionButton
            onPress={() => {
              this.setState({
                editing: false,
                currentAddTitle: "",
                currentAddLink: ""
              });
              this.go(1);
            }}
            buttonColor="rgba(231,76,60,1)"/>
        </View>
        <View style={styles.view}>
          <ToolbarAndroid
            style={styles.header}
            title={this.state.editing ? "Edit bookmark" : "Add bookmark"}
            titleColor="rgba(255, 255, 255, .9)"
            />
          <View style={styles.viewFull}>
            <Text
              style={styles.instructions}
              >Title</Text>
            <TextInput
              ref={(tf) => { this.addBookmarkTitle = tf; }}
              style={styles.addInput}
              onChangeText={(text) => this.setState({currentAddTitle: text})}
              value={this.state.currentAddTitle}
              />
            <Text
              style={styles.instructions}
              >URL</Text>
            <TextInput
              ref={(tf) => { this.addBookmarkLink = tf; }}
              style={styles.addInput}
              onChangeText={(text) => this.setState({currentAddLink: text})}
              value={this.state.currentAddLink}
              />
            <Button
              text='Save'
              raised={true}
              onPress={() => {
                if (!this.state.currentAddTitle){
                  alert("Please enter a title for the bookmark.");
                  return;
                }
                if (!this.state.currentAddLink){
                  alert("Please enter a URL for the bookmark.");
                  return;
                }
                const url_regex = /^(?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,}))\.?)(?::\d{2,5})?(?:[/?#]\S*)?$/i;
                if (!this.state.currentAddLink.match(url_regex)){
                  alert("Please enter a valid URL.");
                  return;
                }
                this.addBookmarkTitle.blur();
                this.addBookmarkLink.blur();
                let modRows = null;
                if (this.state.editing){
                  modRows = this.state.rows;
                  for (let i = 0, l = modRows.length; i < l; ++i){
                    if (modRows[i][0] == this.state.currentTitle
                        && modRows[i][1] == this.state.currentLink){
                      modRows[i][0] = this.state.currentAddTitle;
                      modRows[i][1] = this.state.currentAddLink;
                      break;
                    }
                  }
                } else {
                  modRows = this.state.rows.concat([[
                      this.state.currentAddTitle,
                      this.state.currentAddLink
                    ]]);
                }
                this.setState({
                  rows: modRows,
                  dataSource: (this.lds()).cloneWithRows(modRows)
                });
                Store.save("bookmarks", JSON.stringify({"data": modRows}));
                this.go(0);
              }}
              />
            {renderIf(this.state.editing)(
            <Button
              text='Delete'
              raised={true}
              onPress={() => {
                this.addBookmarkTitle.blur();
                this.addBookmarkLink.blur();
                let modRows = this.state.rows;
                for (let i = 0, l = modRows.length; i < l; ++i){
                  if (modRows[i][0] == this.state.currentTitle
                      && modRows[i][1] == this.state.currentLink){
                    modRows.splice(i, 1);
                    break;
                  }
                }
                this.setState({
                  rows: modRows,
                  dataSource: (this.lds()).cloneWithRows(modRows)
                });
                Store.save("bookmarks", JSON.stringify({"data": modRows}));
                this.go(0);
              }}
              />
            )}
            <Text style={styles.instructions}>Add a website to your qrev bookmars and show it at any computer anytime you wish by simply scanning a qrev.tech code on their screen!</Text>
          </View>
        </View>
        <View style={styles.view}>
          <ToolbarAndroid
            style={styles.header}
            title="Scan a qrev.tech website"
            titleColor="rgba(255, 255, 255, .9)"
            />
          <View style={styles.viewFull}>
            <Camera
              ref={(cam) => {
                this.camera = cam;
              }}
              style={styles.preview}
              aspect={Camera.constants.Aspect.fill}
              onBarCodeRead={this.readCode.bind(this)}
              playSoundOnCapture={false}
              barCodeTypes={["qr"]}>
              <Text style={styles.overlay}></Text>
            </Camera>
          </View>
        </View>
      </ViewPagerAndroid>
    );
  }
  
  readCode(qr){
    if (!this.state.currentScanned){
      try {
        Vibration.vibrate([0, 100], false);
      } catch (ex){
        // oh well
      }
      
      this.setState({
        currentScanned: true
      });
      
      let data = qr.data;
      let decrypted = JSON.parse(Crypto.AES.decrypt(data, "jxWa67xpP0ym855Z72Cl9w3E4djGj016").toString(Crypto.enc.Utf8));
      let keyedUrl = Crypto.AES.encrypt(JSON.stringify({"url": this.state.currentLink}), decrypted.key).toString();
      
      fetch("https://qrev.tech/api/push", {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "session": decrypted.session,
          "payload": keyedUrl
        })
      }).then((response) => {
        let worked = false;
        if (response && response.status == 202){
          worked = true;
        }
        if (!worked){
          alert("A problem has occurred!");
        }
        this.go(0);
      });
    }
  }
}

const styles = StyleSheet.create({
  viewPager: {
    width: "100%",
    height: "100%"
  },
  view: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  viewFull: {
    flex: 1
  },
  
  addButton: {
    position: 'absolute',
    bottom: 10,
    right: 10
  },
  
  addInput: {
    marginBottom: 10,
    width: 320
  },
  
  bookmarkButton: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(51, 51, 51, .2)',
    padding: 10,
    width: '100%'
  },
  bookmarkButtonText: {
    color: '#333333',
    fontSize: 20
  },
  
  header: {
    backgroundColor: '#333333',
    height: 56,
    padding: 10,
    width: '100%'
  },
  currentTitle: {
    fontSize: 24,
    textAlign: 'center',
    padding: 10,
    width: 360
  },
  instructions: {
    fontSize: 19,
    textAlign: 'left',
    color: '#333333',
    marginTop: 5,
    width: 300
  },
  preview: {
    alignItems: 'center',
    height: '100%',
    justifyContent: 'center',
    width: '100%'
  },
  overlay: {
    backgroundColor: 'rgba(255, 255, 255, .2)',
    borderRadius: 5,
    width: 150,
    height: 150
  }
});

AppRegistry.registerComponent('QrevApp', () => QrevApp);
