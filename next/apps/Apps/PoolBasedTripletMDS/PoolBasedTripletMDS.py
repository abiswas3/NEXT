import json
import next.utils as utils
import next.apps.SimpleTargetManager
from next.resource_client.ResourceClient import ResourceClient

class PoolBasedTripletMDS(object):
    def __init__(self):
        self.app_id = 'PoolBasedTripletMDS'
        self.TargetManager = next.apps.SimpleTargetManager.SimpleTargetManager()

    def initExp(self, exp_uid, exp_data, butler):
        if 'targetset' in exp_data['args']['targets'].keys():
            n  = len(exp_data['args']['targets']['targetset'])
            self.TargetManager.set_targetset(exp_data['args']['targets']['targetset'])
        else:
            n = exp_data['args']['targets']['n']
        exp_data['args']['n'] = n
        del exp_data['args']['targets']
        return exp_data

    def getQuery(self, exp_uid, query_request, alg_response, butler):
        left = self.TargetManager.get_target_item(exp_uid, alg_response[0])
        right = self.TargetManager.get_target_item(exp_uid, alg_response[1])
        painted = self.TargetManager.get_target_item(exp_uid, alg_response[2])

        targets = [{'index':left,'label':'left'}, 
                   {'index':right,'label':'right'}]

        if left == painted:
            targets[0]['flag'] = 1
            targets[1]['flag'] = 0
            
        else:
            targets[0]['flag'] = 0
            targets[1]['flag'] = 1

        return {'target_indices':targets}

    def processAnswer(self, exp_uid, query, answer, butler):
        targets = query['target_indices']
        for target in targets:
            if target['label'] == 'center':
                center_id = target['target_id']
            elif target['label'] == 'left':
                left_id = target['target_id']
            elif target['label'] == 'right':
                right_id = target['target_id']
        target_winner = answer['args']['target_winner']
        # make a getModel call ~ every n/4 queries - note that this query will NOT be included in the predict
        experiment = butler.experiment.get()
        num_reported_answers = butler.experiment.increment(key='num_reported_answers_for_' + query['alg_label'])
        
        n = experiment['args']['n']
        if num_reported_answers % ((n+4)/4) == 0:
            butler.job('getModel', json.dumps({'exp_uid':exp_uid,'args':{'alg_label':query['alg_label'], 'logging':True}}))
        q = [left_id, right_id,center_id] if target_winner==left_id else [right_id, left_id,center_id]
        return {'alg_args':{'left_id':left_id, 'right_id':right_id, 'center_id':center_id, 'target_winner':target_winner},
                'query_update':{'target_winner':target_winner, 'q':q}}

    def getModel(self, exp_uid, alg_response, args_dict, butler):
        return {'Xd':alg_response[0], 'num_reported_answers':alg_response[1]}

    def getStats(self, exp_uid, stats_request, dashboard, butler):
        stat_id = stats_request['args']['stat_id']
        task = stats_request['args']['params'].get('task', None)
        alg_label = stats_request['args']['params'].get('alg_label', None)

        # These are the functions corresponding to stat_id
        functions = {'api_activity_histogram':dashboard.api_activity_histogram,
                     'compute_duration_multiline_plot':dashboard.compute_duration_multiline_plot,
                     'compute_duration_detailed_stacked_area_plot':dashboard.compute_duration_detailed_stacked_area_plot,
                     'response_time_histogram':dashboard.response_time_histogram,
                     'network_delay_histogram':dashboard.network_delay_histogram,
                     'most_current_embedding':dashboard.most_current_embedding,
                     'test_error_multiline_plot':dashboard.test_error_multiline_plot}
#}
        default = [self.app_id, exp_uid]
        args = {'api_activity_histogram':default + [task],
                'compute_duration_multiline_plot':default + [task],
                'compute_duration_detailed_stacked_area_plot':default + [task, alg_label],
                'response_time_histogram':default + [alg_label],
                'network_delay_histogram':default + [alg_label],
                'most_current_embedding':default + [alg_label],
                'test_error_multiline_plot':default}
#}
        return functions[stat_id](*args[stat_id])

