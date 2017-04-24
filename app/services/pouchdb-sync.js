import Ember from 'ember';

export default Ember.Service.extend({
  database: Ember.inject.service(),
  localMainDB: null,
  remoteDB: null,

  setup() {
    this.set('localMainDB', this.get('database').get('localMainDB'));
    this.set('remoteDB', this.get('database').get('remoteDB'));

    this.foregroundSync().then(() => {
      this.watchLocalDB();
      this.watchRemoteDB();
    });
  },

  foregroundSync() {
    console.log('foreground syncing');
    let localMainDB = this.get('localMainDB');
    let remoteDB = this.get('remoteDB');
    return localMainDB.sync(remoteDB).on('error', (err) => {
      console.log('foreground sync error:', err);
    });
  },

  backgroundSync() {
    console.log('registering background sync');
    return navigator.serviceWorker.ready
      .then((reg) => {
        return reg.sync.register('sync');
      })
      .then(() => {
        console.log('background sync registration succeeded');
      })
      .catch(() => {
        console.log('background sync registration failed');
      });
  },

  watchLocalDB() {
    let localMainDB = this.get('localMainDB');
    console.log('watching local DB');
    return localMainDB.changes({
      since: 'now',
      live: true
    }).on('change', (change) => {
      console.log('local change: ', change);
      return this.backgroundSync();
    }).on('error', (err) => {
      console.error('local err: ', err);
    });
  },

  watchRemoteDB() {
    let remoteDB = this.get('remoteDB');
    console.log('watching remote DB');
    return remoteDB.changes({
      since: 'now',
      live: true
    }).on('change', (change) => {
      console.log('remote change: ', change);
      return this.backgroundSync();
    }).on('error', (err) => {
      console.error('remote err: ', err);
    });
  }
});
