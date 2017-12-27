import DS from 'ember-data';
import { service } from 'ember-decorators/service';

export default DS.Adapter.extend({
  @service rpc: null,

  createRecord(store, type, snapshot) {
    const {
      wallet,
      source,
      destination,
      amount,
    } = this.serialize(snapshot, { includeId: true });

    return this.get('rpc').send(wallet, source, destination, amount);
  },
});