import Manager from './Manager';
import { TodoistId } from '../types'; // eslint-disable-line no-unused-vars
import Misc from '../models/Misc'; // eslint-disable-line no-unused-vars

const dummyId: TodoistId = -6060842;

class MiscManager extends Manager {
  // eslint-disable-next-line no-unused-vars
  findInApiState(objData: any): any {
    return this.getLocalById(dummyId);
  }

  create(data: Partial<Misc> = {}): Misc {
    return new Misc({ id: dummyId, ...data }, this);
  }

  get current(): Misc {
    let value = this.findInApiState({});
    if (!value) {
      value = this.create({});
    }

    return value;
  }
}

export default MiscManager;
