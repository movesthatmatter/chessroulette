import { UnsubscribeFn } from 'movex-core-util';
import { Pubsy } from 'ts-pubsy';

export class ConditionalBuffer<T> {
  private backlog: T[] = [];

  private pubsy = new Pubsy<{ onFinished: T[] }>();

  private offFinished?: UnsubscribeFn;

  /**
   *
   * @param untilCondition when the untilConition returns TRUE it stop and get is called
   */
  constructor(private props: { until: (item: T) => boolean }) {}

  push(item: T) {
    this.backlog.push(item);

    if (this.props.until(item)) {
      this.pubsy.publish('onFinished', this.backlog);

      // Reset the backlog
      this.backlog = [];

      // Unsubscribe
      this.offFinished?.();
    }
  }

  get() {
    return new Promise<T[]>((resolve) => {
      this.offFinished = this.pubsy.subscribe('onFinished', resolve);
    });
  }
}
