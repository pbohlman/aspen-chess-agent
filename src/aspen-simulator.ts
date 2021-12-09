import { Agent, Log } from '@aspen.cloud/agent-typings';

export default class AgentSimulator {
  readonly log: Log<any>[] = [];
  aspenEnvironment: {
    pushEvent: (
      type: string,
      data: any,
      tags?: Record<string, string>,
    ) => Promise<void>;
    getAggregation: (name: string, params: any) => Promise<any>;
    getView: (name: string, params: any) => Promise<any>;
  };

  constructor(readonly agent: Agent) {
    this.aspenEnvironment = {
      pushEvent: async (type, data, tags) => {
        this.log.push({
          data: { ...data, type },
          tags,
          inserted_at: new Date(),
          id: this.log.length + 1,
        });
      },
      getAggregation: async (name, params) => {
        return this.getAggregation(name, params);
      },
      getView: async (name, params) => {
        return this.getView(name, params);
      },
    };
  }

  async runAction(name: string, params: any) {
    const action = this.agent.actions[name];
    const result = await action(params, this.aspenEnvironment);
    return result;
  }

  async getAggregation(
    name: string,
    { tags }: { tags?: Record<string, string>; range: 'continuous' },
  ) {
    // console.log(
    //   'getting aggregation',
    //   name,
    //   tags,
    //   this.log.filter((evt) =>
    //     !tags ? true : JSON.stringify(evt.tags) === JSON.stringify(tags),
    //   ),
    // );
    const aggregation = this.agent.aggregations[name];
    const { reducer, initialize, serialize } = aggregation;
    const initialData = initialize(undefined);
    return serialize(
      this.log
        .filter((evt) =>
          !tags ? true : JSON.stringify(evt.tags) === JSON.stringify(tags),
        )
        .reduce(reducer, initialData),
    );
  }

  async getView(name: string, params: any) {
    const view = this.agent.views![name];
    return view(params, this.aspenEnvironment);
  }
}
