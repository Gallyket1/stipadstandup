import React, {Component} from 'react';
import './App.css';
import * as moment from "moment";
import {addDoc, collection, deleteDoc, doc, onSnapshot, query, setDoc, where} from "@firebase/firestore";
import {db} from "./firebase-init";

export default class App extends Component{
    constructor(props) {
        super(props);
        this.state = {
            displayDraw: false,
            listWithPresence: [],
            loading: false,
            isAdding: false,
            newMember : '',
            errorMessage: '',
            timeMin: 1,
            timeSec: 30,
            whoSpeaks: 0,
            isClockRunning: false,
            listOfPreviousSpeakers: [],
            showTimeUp: true,
            indexForBold: ''
        }
        this.initialTime = {
            timeMin: 1,
            timeSec: 30
        }
    }

    upateMetiersList() {
        this.setState({
            loading: true
        })
        const q = query(collection(db, "stipadList"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const list = [];
            querySnapshot.forEach((doc) => {
                let docu = doc.data()
                let elem = {
                    genId: doc.id,
                    name: docu.name,
                    stipId: Number(docu.stipId),
                    present: docu.present,
                }

                list.push(elem);
            });
            this.setState({
                listWithPresence: list,
                loading: false
            })
        });
    }

    addDocToFireBase = async(elemToSend, firebaseCollection, xObject) => {
        xObject.setState({
            loading: true,
            doneFirebase: false
        })

        const collectionRef = collection(db, firebaseCollection);
        if(elemToSend.genId){
            await setDoc(doc(db, firebaseCollection, elemToSend.genId), elemToSend)
                .catch(err => {
                    xObject.setState({
                        error: err
                    })
                });
        }else{
            await addDoc(collectionRef, elemToSend)
                .catch(err => {
                    xObject.setState({
                        error: err
                    })
                });
        }
        xObject.setState({
            loading: false,
            doneFirebase: true
        })
        xObject.setState({
            loading: false,
            doneFirebase: true
        })
    }

    dispTimeUp = () => {
        let blink = !this.state.showTimeUp;
        this.setState({
            showTimeUp: blink
        })
    }

    setSpeakingTime = () => {
        this.setState({
            isClockRunning: true
        })
        if(this.state.timeSec === 0 && this.state.timeMin !== 0) {
            this.setState({
                timeMin: 0,
                timeSec: 59
            })
        }else if(this.state.timeSec === 0 && this.state.timeMin === 0){
           /* this.setState({
                timeMin: this.initialTime.timeMin,
                timeSec: this.initialTime.timeSec
            })*/
            this.pauseSpeakers()
        }else{
            if(this.state.isClockRunning){
                return
            }
            this.IntervalId = setInterval(() =>{
               this.countDown()
            }, 1000)
        }
    }

    countDown = () => {
        if(this.state.timeSec > 0){
            this.setState({
                timeSec: this.state.timeSec - 1,
            })
        }else{
            this.setSpeakingTime();
        }
    }

    nextSpeaker = () => {
        this.setState({
            timeMin: this.initialTime.timeMin,
            timeSec: this.initialTime.timeSec
        })
        let effectif = this.state.listWithPresence.filter(x => x.present === 'present').length;
        if(this.state.whoSpeaks === effectif - 1){
            this.setState({
                whoSpeaks: 0
            })
        }else{
            this.setState({
                whoSpeaks:this.state.whoSpeaks + 1
            })
        }
    }

    pauseSpeakers = () => {
        this.setState({
            isClockRunning: false
        })
        clearInterval(this.IntervalId)
    }

    componentDidMount() {
        /*if(localStorage.getItem("StipadList")){
            let existingList = localStorage.getItem("StipadList")
            this.setState({
                listWithPresence: JSON.parse(existingList)
            })
        }else{
            let teamList = ['Bert', 'Filip',
                'Gaël', 'Brecht', 'Joachim', 'John', 'Mamadou', 'Mehdi',
                'Michel', 'Soufyane', 'Ekrem', 'Glen', 'Wim', 'Aymen', 'Ibrahim']
            let{listWithPresence} = this.state
            for(let i = 0; i < teamList.length; i++) {
                let stipId = i + 1
                let name = teamList[i];
                let present= 'present'
                listWithPresence[i] = {stipId, name, present}
            }
            this.setState({
                listWithPresence
            })
        }
        setInterval(() => {
            this.dispTimeUp()
        }, 500)*/
        this.upateMetiersList()
    }

    shuffle(a) {
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    draw = () => {
        let {listWithPresence} = this.state;
        this.shuffle(listWithPresence);
        this.setState({
            listWithPresence,
            displayDraw: true,
            loading: true
        })
        setTimeout(() => {
            setTimeout(() =>
                this.setState({
                    loading: false
                })
            )
        }, 3000)
        this.storeList(listWithPresence)
        listWithPresence.forEach(x => this.addDocToFireBase(x, 'stipadList', this))
    }

    storeList = (list) => {
        localStorage.setItem("StipadList", JSON.stringify(list));
    }

    updtePresence = (stipId, event) => {
        let presenceStatus = event.target.value
        console.log(presenceStatus)
        let clonedListWithPresence = [...this.state.listWithPresence]
        let memberInMofif = clonedListWithPresence.filter(member => member.stipId === stipId)[0];
        memberInMofif.present = presenceStatus;
        this.setState({
            listWithPresence: clonedListWithPresence
        })
    }

    handleChange = (event) => {
        this.setState({
            newMember: event.target.value,
            errorMessage: ''
        })
    }

    addMember = () => {
        let {newMember, listWithPresence} = this.state;
        if(newMember.length < 2){
            this.setState({
                errorMessage: 'Please enter a valid first name.'
            });
            return;
        }

        let newStipadMemner = {stipId: Date.now(), name: newMember, present: 'present'};
        listWithPresence.push(newStipadMemner);
        this.setState({
            listWithPresence,
            newMember: '',
            isAdding: false
        })
    }
    deleteMember = async (stipId) => {
        let firstNameToDelete = this.state.listWithPresence.find(member => member.stipId === stipId).name
        const confirmation = window.confirm(`Are you sure you want to delete ${firstNameToDelete} ?`)
        if (!confirmation) {
            return;
        }
        let newList = this.state.listWithPresence.filter(member => member.stipId !== stipId)
        let elem = this.state.listWithPresence.find(member => member.stipId === stipId)
        if (elem.genId) {
            await deleteDoc(doc(db, "stipadList", elem.genId));
        }
        this.setState({
            listWithPresence: newList
        })

        this.storeList(newList);

    }
    standUpDone = () => {
        this.setState({
            displayDraw: false,
            timeMin: this.initialTime.timeMin,
            timeSec: this.initialTime.timeSec,
            whoSpeaks: 0,
            isClockRunning: false
        });
        clearInterval(this.IntervalId)

    }

    render() {
        let dateToday = moment().format("DD-MM-YYYY");
        let {displayDraw, listWithPresence, loading, isAdding, errorMessage,
            timeSec, timeMin, isClockRunning, showTimeUp, indexForBold} = this.state;
        let warningTime = timeMin === 0 && timeSec < 30
        let showTeam = listWithPresence.map((member, index) =>
            <div style={{flexDirection: 'row', display: 'flex', flex: 1, }} key={index}>
                <div style={styles.names}>
                    <span style = {{fontWeight: 'bold', color: member.present === 'absent'? 'red': 'black'}}>
                    {`${index + 1}.  ${member.name}`}
                    </span>
                </div>
                <div style={styles.names}>
                    <select
                        defaultValue={member.present}
                        style = {styles.selectStyle}
                        onChange={(event) => {this.updtePresence(member.stipId, event)}}>
                        <option value={"present"}>present</option>
                        <option value={"absent"}>absent</option>
                    </select>
                </div>
                <span onClick={() => this.deleteMember(member.stipId)}
                      title={"Delete"}
                      style={{cursor: "pointer", fontWeight: indexForBold === member.stipId ? "bold" : ""}}
                      onMouseMove={() => this.setState({indexForBold: member.stipId})}
                      onMouseLeave={() => this.setState({indexForBold:''})}
                >
                    {indexForBold === member.stipId ? 'X' : 'x'}
                </span>
            </div>)
        let showDraw = listWithPresence.filter(x => x.present === 'present').map((member, index) =>
            <div style={this.state.whoSpeaks === index? styles.main.inSpeech: styles.main.normal} key={index}>
                <div style={styles.names}>
                    <span style = {{fontWeight: 'bold', color: 'green'}}>{`${index + 1}.  ${member.name}`}</span>
                </div>
                {this.state.whoSpeaks === index?
                    <div style = {styles.names}>
                        {timeMin + timeSec > 0?
                            <span style = {{fontWeight: 'bold', color: warningTime?'red': 'black', fontSize: 18}}>
                            {timeMin.toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false}) +
                            ":" + timeSec.toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false})}
                            </span>:
                            <span style ={{color: 'red', fontWeight: 'bold', fontSize: 18, display: showTimeUp? 'flex': 'none'}}>
                                Time up
                            </span>
                        }
                    </div>: null
                }
            </div>
        )

        let addingMember = (
            <div style={{
                margin: 30,
                border: '1px solid green',
                height: 350,
                width: 300,
                alignItems: 'center',
                justifyItems: 'center', padding: 10,}}>
                <div>
                    <h3 style = {{color: 'blue'}}>ADDING A MEMBER</h3>
                </div>
                {errorMessage &&
                <p style = {{color: 'red'}}>{errorMessage}</p>}
                <div style={{marginTop: 70, display: 'flex'}}>
                    <div>
                        <input
                            placeholder={"Member's first name"}
                            type="text"
                            onChange={(event) => this.handleChange(event)}/>
                    </div>
                    <div style = {{marginLeft: 20}}>
                        <button onClick={() => this.addMember()} style={{color: 'white', backgroundColor: 'green'}}>
                            Add
                        </button>
                    </div>
                </div>
                <div style={{margin: 30}}>
                    <button
                        onClick={() => this.setState({isAdding: false})}
                        style={{color: 'white', backgroundColor: 'red'}}>
                        Cancel
                    </button>
                </div>
            </div>
        )

        if(loading){
            return(
                <div style = {{margin: 100}}>
                    <div style = {{color: 'indianred', fontWeight: 'bold', margin: 15, textAlign: 'center'}}>
                        <h3>Drawing...</h3>
                    </div>
                    <img src="https://media.giphy.com/media/Ps8XflhsT5EVa/giphy.gif" alt="this slowpoke moves" />
                </div>
            )
        }
        if(isAdding){
            return addingMember
        }
        return (
            <div style = {styles.content}>
                <h2 style = {{color: 'indianred'}}>
                    Welcome to the STIPAD stand-up draw!
                </h2>
                {displayDraw?
                    <div>
                        <h4 style={{color: 'blue'}}>
                            {`The order of the stand-up for today (${dateToday}) is: `}
                        </h4>
                        {showDraw}
                    </div>:
                    <div>
                        <h4 style={{color: 'blue'}}>First take the presence, then click on Draw !</h4>
                        { listWithPresence.length > 0 ?
                        <div>
                            {showTeam}
                        </div>:
                            <h6>
                                The list of members will be displayed here
                            </h6>
                        }
                    </div>}
                {!displayDraw?
                    <div style = {{display:'flex'}}>
                        <div>
                            <button style={styles.buttonStyle} onClick={() => this.draw()}>
                                Draw
                            </button>
                        </div>
                        <div>
                            <button style={styles.buttonStyle} onClick={() => this.setState({isAdding: true, errorMessage: ''})}>
                                Add member
                            </button>
                        </div>
                        <div>
                            <button style={{...styles.buttonStyle, backgroundColor:'red'}}
                                    onClick={() => this.setState({listWithPresence: []})}>
                                Delete the list
                            </button>
                        </div>
                    </div> :
                    <div>
                        <button
                            style={{...styles.buttonStyle, backgroundColor:'red'}}
                            onClick={() => this.standUpDone()}>
                            Done
                        </button>
                        <button
                            disabled={timeSec + timeMin <= 0}
                            style={{...styles.buttonStyle, backgroundColor:isClockRunning? 'red': 'green'}}
                            onClick={() => !isClockRunning? this.setSpeakingTime(): this.pauseSpeakers()}>
                            {isClockRunning? "Pause": "Start"}
                        </button>
                        <button
                            style={{...styles.buttonStyle, backgroundColor:'green'}}
                            onClick={() => this.nextSpeaker()}>
                            Next
                        </button>
                    </div>
                    }
            </div>
        );
    }
}

const styles = {
    content: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonStyle: {
        margin: 20,
        backgroundColor: 'green',
        height: 32,
        color: 'white',
        width: 120
    },
    names: {
        borderWidth: 1,
        borderColor: 'red',
        flex: 1,
        height: 28
    },
    selectStyle: {
        backgroundColor:'lemonchiffon',
        color: 'black'
    },
    main: {
        inSpeech:{
            flexDirection: 'row',
            display: 'flex',
            flex: 1,
            border:'solid black 4px'
        },
        normal: {
            flexDirection: 'row',
            display: 'flex',
            flex: 1,
        }
    }
}
