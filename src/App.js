import React, {Component} from 'react';
import './App.css';

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
        if(localStorage.getItem("StipadList")){
            let existingList = localStorage.getItem("StipadList")
            this.setState({
                listWithPresence: JSON.parse(existingList)
            })
        }else{
            let teamList = ['Ali', 'Bert', 'Eddy', 'Filip',
                'Gaël', 'Huguette', 'Jonathan', 'John', 'Kristof', 'Mamadou',
                'Michel', 'Soufyane', 'Glen', 'Wim', 'Varun']
            let{listWithPresence} = this.state
            for(let i = 0; i < teamList.length; i++) {
                let id = i + 1
                let name = teamList[i];
                let present= 'present'
                listWithPresence[i] = {id, name, present}
            }
            this.setState({
                listWithPresence
            })
        }
        setInterval(() => {
            this.dispTimeUp()
        }, 500)
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
        }, 1500)
        this.storeList(listWithPresence)
    }

    storeList = (list) => {
        localStorage.setItem("StipadList", JSON.stringify(list));
    }

    updtePresence = (id, event) => {
        let presenceStatus = event.target.value
        console.log(presenceStatus)
        let clonedListWithPresence = [...this.state.listWithPresence]
        let memberInMofif = clonedListWithPresence.filter(member => member.id === id)[0];
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

        let newStipadMemner = {id: Date.now(), name: newMember, present: 'present'};
        listWithPresence.push(newStipadMemner);
        this.setState({
            listWithPresence,
            newMember: '',
            isAdding: false
        })
    }
    deleteMember = (id) => {
        let firstNameToDelete = this.state.listWithPresence.find(member => member.id === id).name
        const confirmation = window.confirm(`Are you sure you want to delete ${firstNameToDelete} ?`)
        if(!confirmation){
            return;
        }
        let newList = this.state.listWithPresence.filter(member => member.id !== id)
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
        let dateToday = new Date();
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
                        onChange={(event) => {this.updtePresence(member.id, event)}}>
                        <option value={"present"}>present</option>
                        <option value={"absent"}>absent</option>
                    </select>
                </div>
                <span onClick={() => this.deleteMember(member.id)}
                      title={"Delete"}
                      style={{cursor: "pointer", fontWeight: indexForBold === member.id ? "bold" : ""}}
                      onMouseMove={() => this.setState({indexForBold: member.id})}
                      onMouseLeave={() => this.setState({indexForBold:''})}
                >
                    {indexForBold === member.id ? 'X' : 'x'}
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
                    <div style = {{color: 'indianred', fontWeight: 'bold', margin: 15}}>
                        <h3>Drawing...</h3>
                    </div>
                    <div className="spinner-grow text-muted"></div>
                    <div className="spinner-grow text-primary"></div>
                    <div className="spinner-grow text-success"></div>
                    <div className="spinner-grow text-info"></div>
                    <div className="spinner-grow text-warning"></div>
                    <div className="spinner-grow text-danger"></div>
                    <div className="spinner-grow text-secondary"></div>
                    <div className="spinner-grow text-dark"></div>
                    <div className="spinner-grow text-light"></div>
                </div>
            )
        }
        if(isAdding){
            return addingMember
        }
        return (
            <div style = {styles.content}>
                <h2 style = {{color: 'indianred'}}>
                    Welcome to the STIPAD stand up draw
                </h2>
                {displayDraw?
                    <div>
                        <h4 style={{color: 'blue'}}>
                            {`The order of the stand up for today 
              (${dateToday.getDate()}/${dateToday.getMonth() + 1}/${dateToday.getFullYear()}) is: `}
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
