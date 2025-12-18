import { IFastEventService } from '@/engine/interfaces';
import { ServiceLocator } from '@/engine/services/ServiceLocator';

type FastEventHandler = (type: number, a1: number, a2: number, a3: number, a4: number) => void;

export class EventReader {
  private cursor: number;
  private bus: IFastEventService;

  constructor(bus?: IFastEventService) {
    // If no bus provided (e.g. in tests), try ServiceLocator, otherwise fallback constitutes a crash or mock needs
    this.bus = bus || ServiceLocator.getFastEventBus();
    this.cursor = this.bus.getCursor();
  }

  public process(handler: FastEventHandler) {
    // The bus implementation handles the looping and buffer wrapping.
    // We just update our local cursor to match where the bus says we stopped reading.
    this.cursor = this.bus.readEvents(this.cursor, handler);
  }
}
