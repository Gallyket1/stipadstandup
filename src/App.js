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
            indexForBold: '',
            readyToDraw: false,
            drawTeams : [],
            newTeamName: '',
            selectedTeam: '',
            teamInCreation: true,
            newMembers : []
        }
        this.initialTime = {
            timeMin: 1,
            timeSec: 30
        }
    }
    beginTeamCreation = () => {
        this.setState({
            teamInCreation: true,
            selectedTeam: this.state.newTeamName
        })
    }

    storeTeamName = (event) => {
        localStorage.setItem("selectedTeam", event.target.value)
    }
    getSelectedTeamFromLocal = () => {
        if (localStorage.getItem("selectedTeam")) {
            this.setState({
                selectedTeam : localStorage.getItem("selectedTeam")
            })
        }
    }

    upateMetiersList() {
        let {selectedTeam} = this.state
        this.setState({
            loading: true
        })
        const q = selectedTeam
            ? query(collection(db, "stipadList"), where("teamName", "==", selectedTeam))
            : query(collection(db, "stipadList"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const list = [];
            querySnapshot.forEach((doc) => {
                let docu = doc.data()
                let elem = {
                    genId: doc.id,
                    name: docu.name,
                    stipId: (docu.stipId),
                    present: docu.present,
                    order: docu.order,
                    teamName: docu.teamName
                }

                list.push(elem);
            });
            this.setState({
                listWithPresence: list,
                loading: false
            })
        });
    }
/*    componentDidUpdate(prevProps, prevState) {
        if (prevState.selectedTeam !== this.state.selectedTeam && !this.state.loading) {
            this.upateMetiersList();
        }
    }*/
    loadTeams() {
        this.setState({
            loading: true
        })
        const q = query(collection(db, "drawTeams"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const list = [];
            querySnapshot.forEach((doc) => {
                let docu = doc.data()
                let elem = {
                    genId: doc.id,
                    name: docu.nom,
                }

                list.push(elem);
            });
            this.setState({
                drawTeams: list,
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
            console.log(elemToSend)
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

    resetTime = () => {
        this.pauseSpeakers()
        this.setState({
            timeMin: this.initialTime.timeMin,
            timeSec: this.initialTime.timeSec
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
        let{selectedTeam} = this.state
        this.setState({
            timeMin: this.initialTime.timeMin,
            timeSec: this.initialTime.timeSec
        })
        let effectif = this.state.listWithPresence.filter(x => x.present === 'present').filter(x => x.teamName === selectedTeam).length;
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
        this.getSelectedTeamFromLocal()
        this.loadTeams()
        this.upateMetiersList()
    }

    shuffle(a) {

        let previousFirst = a.find(x => x.order === 1)
        let drawIndex = 0;
        while(drawIndex < 10000){
            for (let i = a.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [a[i], a[j]] = [a[j], a[i]];
                //a[i].order = i
            }
            drawIndex++;
        }
        for(let i = 0; i < a.length; i++){
            a[i].order = i + 1;
        }
        if(previousFirst && previousFirst.genId === a[0].genId){
            [a[0], a[a.length-1]] = [a[a.length-1], a[0]];
        }
        /*if(previousFirst && previousFirst.genId === a[0].genId){
            [a[0], a[a.length - 1]] = [a[a.length - 1], a[0]];
        }*/
        return a;
    }

    draw = () => {
        let {listWithPresence, newTeamName} = this.state;
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
        if (newTeamName) {
            let newTeam = {nom: newTeamName}
            this.addDocToFireBase(newTeam, 'drawTeams', this)
        }
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
    handleGenChange = (event, field) => {
        this.setState({
            [field]: event.target.value,
            errorMessage: ''
        })
    }

    addMember = () => {
        let {newMember, listWithPresence, selectedTeam} = this.state;
        if(newMember.length < 2){
            this.setState({
                errorMessage: 'Please enter a valid first name.'
            });
            return;
        }
        let members = newMember.split(',');

        //let newStipadMemner = {stipId: uuidv4(), name: newMember, present: 'present', teamName: selectedTeam};
        members.forEach(x => {
            let stipId = Date.now() + Math.random().toString(36).substr(2, 9);
            let newMember = {stipId, name: x.trim(), present: 'present', teamName: selectedTeam};
            listWithPresence.push(newMember);
        });
        this.setState({
            listWithPresence: listWithPresence,
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
    specialUpdate = () => {
        let {listWithPresence} = this.state
        listWithPresence.forEach(x => {
            x.teamName ='Stipad/Patmgt'
            this.addDocToFireBase(x, 'stipadList', this)
        })

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
            timeSec, timeMin, isClockRunning, showTimeUp, indexForBold, newTeamName, selectedTeam} = this.state;
        let warningTime = timeMin === 0 && timeSec < 30
        let filteredTeam = listWithPresence.filter(x => x.teamName === selectedTeam)
        let showTeam = filteredTeam.map((member, index) =>
            <div style={{flexDirection: 'row', display: 'flex', flex: 1, }} key={index}>
                <div style={styles.names}>
                    <span style = {{fontWeight: 'bold', color: member.present === 'absent'? 'red': 'black'}}>
                    {`${index + 1}.  ${member.name}`}
                    </span>
                </div>
                <div style={styles.names}>
                    <select
                        className={'form-select-sm'}
                        defaultValue={member.present}
                        onChange={(event) => {this.updtePresence(member.stipId, event)}}>
                        <option value={"present"}>present</option>
                        <option value={"absent"}>absent</option>
                    </select>
                    <br/>
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
        let showDraw = filteredTeam.sort((a, b) => a.order - b.order).filter(x => x.present === 'present').map((member, index) =>
            <div style={this.state.whoSpeaks === index? styles.main.inSpeech: styles.main.normal} key={index}>
                <div style={styles.names}>
                    <span style = {{fontWeight: 'bold', color: 'green'}}>{`${index + 1}.  ${member.name}`}</span>
                </div>
                {this.state.whoSpeaks === index ?
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
                marginTop: 30,

                alignItems: 'center',
                justifyItems: 'center', padding: 10,}}>
                <div>
                    <h3 style = {{color: 'blue'}}>ADDING NEW MEMBERS</h3>
                </div>
                <h6 className={'alert-danger'}>Please enter the members' first names, separated by commas.</h6>
                {errorMessage &&
                    <p style = {{color: 'red'}}>{errorMessage}</p>}
                <div style={{marginTop: 70, display: 'flex'}}>
                    <div>
                        <input
                            style={{width: 500}}
                            className={'form-control'}
                            placeholder={"Member's first names separated by commas"}
                            type="text"
                            onChange={(event) => this.handleChange(event)}/>
                    </div>
                </div>
                <div style={{margin: 30, flexDirection: "row", display: "flex"}}>
                    <button
                        className={'btn btn-danger'}
                        onClick={() => this.setState({isAdding: false})}>
                        Cancel
                    </button>
                    <div style={{marginLeft: 20}}>
                        <button onClick={() => this.addMember()} className={'btn btn-success'}>
                            Add
                        </button>
                    </div>
                </div>
            </div>
        )

        let welcomeScreen = (
            <div style={{margin: 30, textAlign: 'center'}}>
                <h2>Welcome to the stand-up draw system</h2>
                <h6>Please choose your team or create a new team to get started.</h6>
                <br/>
                <div style={styles.names}>
                    <select className={'form-select-lg'}
                            onChange={(event) => {
                                this.handleGenChange(event, 'selectedTeam');
                                this.storeTeamName(event)
                            }}>
                        <option value="">Select a team</option>
                        {this.state.drawTeams.map((team, index) => (
                            <option key={index} value={team.name}>{team.name}</option>
                        ))}
                    </select>
                </div>
                <div style={{marginTop: 70, display: 'flex', justifyContent: "center"}}>
                    <div>
                        <input
                            className={'form-control'}
                            value={newTeamName}
                            placeholder={"Enter your team name"}
                            type="text"
                            onChange={(event) => this.handleGenChange(event, 'newTeamName')}/>
                    </div>
                    <div style={{marginLeft: 20}}>
                        <button className={'btn btn-success'} disabled={!newTeamName} onClick={() => this.beginTeamCreation()}
                                >
                            Create new team list
                        </button>
                    </div>
                </div>
            </div>
        )

        let drawScreen = (
            <div style={styles.content}>
                <h2 style={{color: 'indianred'}}>
                    {`Welcome to the ${selectedTeam} stand-up draw!`}
                </h2>
                {displayDraw ?
                    <div>
                        <h4 style={{color: 'blue'}}>
                            {`The order of the stand-up for today (${dateToday}) is: `}
                        </h4>
                        {showDraw}
                    </div> :
                    <div style={{justifyContent: 'center', textAlign: "center"}}>
                        <h4>
                            {filteredTeam.length > 0 ? 'First take the presence, then click on Draw !' : 'Please add members to the team'}
                        </h4>
                        {filteredTeam.length > 0 ?
                            <div>
                                {showTeam}
                            </div> :
                            <h6>

                            </h6>
                        }
                    </div>}
                {!displayDraw ?
                    <div style={{display: 'flex'}}>
                        <div>
                            <button disabled={filteredTeam.length === 0} className={'btn btn-success'} style={styles.buttonStyle} onClick={() => this.draw()}>
                                <i className="fa fa-random" aria-hidden="true"></i>
                                &nbsp;
                                Draw
                            </button>
                        </div>
                        <div>
                            <button className={'btn btn-dark'} style={styles.buttonStyle}
                                    onClick={() => this.setState({isAdding: true, errorMessage: ''})}>
                                <i className="fa fa-plus-circle" aria-hidden="true"></i>
                                &nbsp;
                                Add members
                            </button>
                        </div>
                        <div>
                            <button className={'btn btn-danger'} style={{...styles.buttonStyle}}
                                    onClick={() => this.setState({selectedTeam: '', newTeamName: ''})}>
                                <i className="fa fa-home" aria-hidden="true"></i>
                                &nbsp;
                                Home screen
                            </button>
                        </div>
                    </div> :
                    <div>
                        <button
                            className={'btn btn-danger'}
                            style={{...styles.buttonStyle}}
                            onClick={() => this.standUpDone()}>
                            Done
                        </button>
                        <button
                            className={'btn btn-success'}
                            disabled={timeSec + timeMin <= 0}
                            style={{...styles.buttonStyle}}
                            onClick={() => !isClockRunning ? this.setSpeakingTime() : this.pauseSpeakers()}>
                            {isClockRunning ? "Pause" : "Start"}
                        </button>
                        <button
                            className={'btn btn-success'}
                            style={{...styles.buttonStyle}}
                            onClick={() => this.nextSpeaker()}>
                            Next
                        </button>
                        <button
                            className={'btn btn-danger'}
                            style={{...styles.buttonStyle,}}
                            onClick={() => this.resetTime()}>
                            Reset timer
                        </button>
                    </div>
                }
            </div>
        )

        if (loading) {
            return (
                <div style={{margin: 100}}>
                    <div style={{color: 'indianred', fontWeight: 'bold', margin: 15, textAlign: 'center'}}>
                        <h3>Drawing...</h3>
                    </div>
                    <img src="https://media.giphy.com/media/Ps8XflhsT5EVa/giphy.gif" alt="this slowpoke moves"/>
                </div>
            )
        }
        if (isAdding) {
            return addingMember
        }
        if(selectedTeam){
            return drawScreen
        }
        return welcomeScreen
    }
}

const styles = {
    content: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonStyle: {
        margin: 20,

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
