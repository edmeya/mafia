import _ from  'lodash';
import React from "react";
import block from 'bem-cn';
import moment from "moment";
import 'moment/locale/ru';
import log from '../static/gameHistory';
import {roles, translateRole} from '../static/statics';
import './app.css';

const b = block('app');

moment.locale('ru');

const getRate = (full = 1, value = 0) => parseFloat(((value * 100) / full).toFixed(1));

class App extends React.Component {
  stats = {
    games: {
      byDays: [],
    },
    players: {
      list: {},
    },
    meetings: {
      byDays: [],
      log: {},
      gamesPerMeetingMin: 99,
      gamesPerMeetingMax: 0,
    },
  };

  state = {
    meetingInfo: '',
    plrInfo: '',
  }

  info = React.createRef();

  constructor(props) {
    super(props);
    const games = this.stats.games;
    const meetings = this.stats.meetings;
    const players = this.stats.players;

    games.count = log.length;
    log.forEach(log => {
      if (log.win === roles.mafia) {
        games.mafiaWin = _.add(games.mafiaWin, 1);
        games.mafiaWinRate = getRate(games.count, games.mafiaWin);
      } else {
        games.cityWin = _.add(games.cityWin, 1);
        games.cityWinRate = getRate(games.count, games.cityWin);
      }
      const date = moment(log.date, "DD-MM-YYYY");
      games.byDays[date.format('d')] = _.add(games.byDays[date.format('d')], 1);
      if (!_.has(meetings.log, date.format('X'))) {
        _.set(meetings.log, date.format('X'),  []);
      }
      meetings.log[date.format('X')].push(log);
      meetings.last = date.fromNow();

      log.players.forEach(plr => {
        if (!players.list[plr.name]) {
          players.list[plr.name] = {
            byRoles: {},
          }
        }
        const p = players.list[plr.name];
        p.games = _.add(p.games, 1);
        if (plr.win) {
          p.win = _.add(p.win, 1);
        } else {
          p.lose = _.add(p.lose, 1);
        }
        p.byRoles[plr.role] = _.add(p.byRoles[plr.role], 1);
        p.winRate = getRate(p.games, p.win);
        p.loseRate = getRate(p.games, p.lose);
        p.lastGame = date.fromNow();
      })
    });

    _.forEach(meetings.log, (log, date) => {
      meetings.gamesPerMeetingMax = Math.max(meetings.gamesPerMeetingMax, log.length);
      meetings.gamesPerMeetingMin = Math.min(meetings.gamesPerMeetingMin, log.length);
      const day = moment(date, 'X').format('d');
      meetings.byDays[day] = _.add(meetings.byDays[day], 1);
    });

    const plrStats = _.reduce(players.list, (result, p, name) => {
      const r = { ...result };
      if (p.winRate > r.mostWinRate.value) { // TODO: несколько человек
        r.mostWinRate.name = name;
        r.mostWinRate.value = p.winRate;
      }
      if (p.winRate < r.mostLoseRate.value) {
        r.mostLoseRate.name = name;
        r.mostLoseRate.value = p.winRate;
      }
      if (p.games > r.mostActive.value) {
        r.mostActive.name = name;
        r.mostActive.value = p.games;
      }
      if (p.games < r.lessActive.value) {
        r.lessActive.name = name;
        r.lessActive.value = p.games;
      }
      if (p.byRoles[roles.mafia] > r.mostMafia.value) {
        r.mostMafia.name = name;
        r.mostMafia.value = p.byRoles[roles.mafia];
      }
      if (p.byRoles[roles.don] > r.mostDon.value) {
        r.mostDon.name = name;
        r.mostDon.value = p.byRoles[roles.don];
      }
      if (p.byRoles[roles.citizen] > r.mostCitizen.value) {
        r.mostCitizen.name = name;
        r.mostCitizen.value = p.byRoles[roles.citizen];
      }
      if (p.byRoles[roles.sheriff] > r.mostSheriff.value) {
        r.mostSheriff.name = name;
        r.mostSheriff.value = p.byRoles[roles.sheriff];
      }
      return r;
    }, {
      mostActive: { name: '', value: 0 },
      lessActive: { name: '', value: 9999999 },
      mostWinRate: { name: '', value: 0 },
      mostLoseRate: { name: '', value: 200 },
      mostMafia: { name: '', value: 0 },
      mostDon: { name: '', value: 0 },
      mostCitizen: { name: '', value: 0 },
      mostSheriff: { name: '', value: 0 },
    });

    _.merge(players, plrStats);
  }

  onNameClick = name => () => {
    this.setState({
      plrInfo: name
    });
  }

  onMeetingClick = date => () => {
    this.setState({
      meetingInfo: date
    });
  }

  onInfoClick = e => {
    if (e.target === this.info.current) {
      this.setState({
        meetingInfo: '',
        plrInfo: '',
      })
    }
  }

  getArchiveBlock = () => {
    const { meetings } = this.stats;

    return (
      <div className={b('block')}>
        <strong>Архив</strong>
        { Object.keys(meetings.log).reverse().map(date => (
          <div className={b('row', { clickable: true })} key={date} onClick={this.onMeetingClick(date)}>
            <span>{moment(date, 'X').format('D MMMM YYYY')}</span>
            <em>{ moment(date, 'X').fromNow() }</em>
          </div>
        ))}
      </div>
    );
  }

  getPlayersListBlock = () => {
    const { players } = this.stats;
    const chunks = _.chunk(Object.keys(players.list).sort(), Object.keys(this.stats.meetings.log).length);
    return (
      <div className={b('block')}>
        <strong>Игроки</strong>
        <div className={b('inner-list')}>
          { chunks.map((data, index) => (
            <div className={b('col')} style={{ width: `${Math.floor(100 / chunks.length)}%`}} key={`col-${index}`}>
              { data.map(plr => (
                <div className={b('row', { clickable: true })} key={plr} onClick={this.onNameClick(plr)}>
                  <span>{plr}</span><em>{players.list[plr].lastGame}</em>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  getGamesBlock = () => {
    const { games } = this.stats;

    return (
      <div className={b('block')}>
        <strong>Игры</strong>
        <div className={b('row')}><span>Всего</span><span>{ games.count }</span></div>
        <div className={b('row')}><span>Побед мафии</span><span>{ games.mafiaWin } ({games.mafiaWinRate}%)</span></div>
        <div className={b('row')}><span>Побед мирных</span><span>{ games.cityWin } ({games.cityWinRate}%)</span></div>
        <div className={b('row')}><span>По дням недели</span></div>
        <div className={b('row', {days: true })}><span>ПН</span><span>ВТ</span><span>СР</span><span>ЧТ</span><span>ПТ</span><span>СБ</span><span>ВС</span></div>
        <div className={b('row', {days: true })}>
          { [1, 2, 3, 4, 5, 6, 0].map(index => <span key={`game-${index}`}>{_.get(games.byDays, `[${index}]`, '-')}</span>) }
        </div>
      </div>
    );
  }

  getMeetingsBlock = () => {
    const { meetings } = this.stats;

    return (
      <div className={b('block')}>
        <strong>Встречи</strong>
        <div className={b('row')}><span>Всего</span><span>{ Object.keys(meetings).length }</span></div>
        <div className={b('row')}><span>Последняя</span><span>{ meetings.last }</span></div>
        <div className={b('row')}><span>Минимум игр за вечер</span><span>{ meetings.gamesPerMeetingMin }</span></div>
        <div className={b('row')}><span>Максимум игр за вечер</span><span>{ meetings.gamesPerMeetingMax }</span></div>
        <div className={b('row')}><span>По дням недели</span></div>
        <div className={b('row', {days: true })}><span>ПН</span><span>ВТ</span><span>СР</span><span>ЧТ</span><span>ПТ</span><span>СБ</span><span>ВС</span></div>
        <div className={b('row', {days: true })}>
          { [1, 2, 3, 4, 5, 6, 0].map(index => <span key={`meeting-${index}`}>{_.get(meetings.byDays, `[${index}]`, '-')}</span>) }
        </div>
      </div>
    );
  }

  getPlayersBlock = () => {
    const { players } = this.stats;

    return (
      <div className={b('block')}>
        <strong>Встречи</strong>
        <div className={b('row')}><span>Всего</span><span>{ Object.keys(players.list).length }</span></div>
        <div className={b('row')}><span>Наиболее активный</span><span>{ players.mostActive.name } ({ players.mostActive.value } игр)</span></div>
        <div className={b('row')}><span>Наимение активный</span><span>{ players.lessActive.name } ({ players.lessActive.value } игр)</span></div>
        <div className={b('row')}><span>Наивысший винрейт</span><span>{ players.mostWinRate.name } ({ players.mostWinRate.value }%)</span></div>
        <div className={b('row')}><span>Наинизший винрейт</span><span>{ players.mostLoseRate.name } ({ players.mostLoseRate.value }%)</span></div>
        <div className={b('row')}><span>Главный мирный</span><span>{ players.mostCitizen.name } ({ players.mostCitizen.value } игр)</span></div>
        <div className={b('row')}><span>Главный шериф</span><span>{ players.mostSheriff.name } ({ players.mostSheriff.value } игр)</span></div>
        <div className={b('row')}><span>Главный мафиози</span><span>{ players.mostMafia.name } ({ players.mostMafia.value } игр)</span></div>
        <div className={b('row')}><span>Главный дон</span><span>{ players.mostDon.name } ({ players.mostDon.value } игр)</span></div>
      </div>
    );
  }

  getMeetingInfo = date => {
    const data = this.stats.meetings.log[date];
    return data.map((game, index) => (
      <div className={b('block')} key={`game-${index}`}>
        <strong>Игра {index + 1} (Победа {game.win === roles.mafia ? 'мафии' : 'мирных'})</strong>
        { (_.orderBy(game.players, 'name' )).map(plr => (
          <div className={b('row', { role: plr.role })} key={`plr-${plr.name}`}>
            <span>{plr.name}</span><span>{ translateRole(plr.role) }</span>
          </div>
        ))}
      </div>
    ));
  }

  getPlrInfo = name => {
    const data = this.stats.players.list[name];
    return (
      <div className={b('block')}>
        <strong>{name}</strong>
        <div className={b('row')}><span>Последняя активность</span><span>{ data.lastGame }</span></div>
        <div className={b('row')}><span>Всего игр</span><span>{ data.games }</span></div>
        <div className={b('row')}><span>Побед</span><span>{ data.win } ({data.winRate}%)</span></div>
        <div className={b('row')}><span>Поражений</span><span>{ data.lose } ({data.loseRate}%)</span></div>
        <strong>Игр по ролям</strong>
        { _.map(data.byRoles, (value, role) => (
          <div className={b('row')} key={role}>
            <span>{translateRole(role)}</span>
            <span>{value} ({getRate(data.games, value)}%)</span>
          </div>
        ))}
      </div>
    )
  }

  getInfo = () => {
    const {
      plrInfo,
      meetingInfo,
    } = this.state;

    if (!plrInfo && !meetingInfo) {
      return null;
    }

    return  (
      <div className={b('info')} onClick={this.onInfoClick} ref={this.info}>
        <div className={b('info-content')}>
          <div className={b("inner-list")}>
           { plrInfo && this.getPlrInfo(plrInfo) }
           { meetingInfo && this.getMeetingInfo(meetingInfo) }
          </div>
        </div>
      </div>
    )
  }

  render() {
    return (
      <div className={b()}>
        <div className={b('col', { info: true })}>
          { this.getMeetingsBlock() }
          { this.getGamesBlock() }
          { this.getPlayersBlock() }
        </div>
        <div className={b('col', { archive: true })}>
          { this.getArchiveBlock() }
        </div>
        <div className={b('col', { players: true })}>
          { this.getPlayersListBlock() }
        </div>
        { this.getInfo() }
      </div>
    );
  }
}

export default App;
