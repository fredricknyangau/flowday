INSERT INTO schedule_blocks
    (start_time, label, block_type, is_protected, sort_order, notes)
SELECT * FROM (VALUES
    ('07:30'::time, 'Wake up — check WhatsApp for updates'::varchar,  'Personal'::varchar,  FALSE, 1,  'Check for new assignments only — do not start working yet'),
    ('08:07'::time, 'Baby school drop-off'::varchar,                   'Family'::varchar,    TRUE,  2,  'Non-negotiable. Do not schedule anything here.'),
    ('08:30'::time, 'Freshen up + skincare routine'::varchar,          'Personal'::varchar,  FALSE, 3,  'Your transition time. Keep it.'),
    ('09:30'::time, 'READING BLOCK'::varchar,                          'PROTECTED'::varchar, TRUE,  4,  'Your mental reset. 60 minutes minimum.'),
    ('10:30'::time, 'LEARNING BLOCK — coding'::varchar,               'PROTECTED'::varchar, TRUE,  5,  '30 minutes every day. One lesson. No skipping.'),
    ('11:00'::time, 'Chores + Breakfast'::varchar,                     'Personal'::varchar,  FALSE, 6,  'Eat properly. You are working overnight.'),
    ('11:30'::time, 'Work session 1'::varchar,                         'Work'::varchar,      FALSE, 7,  'Highest urgency assignment first.'),
    ('13:30'::time, 'Short break (15 min)'::varchar,                   'Break'::varchar,     FALSE, 8,  'Stand up, step away from the screen.'),
    ('13:45'::time, 'Work session 2'::varchar,                         'Work'::varchar,      FALSE, 9,  'Second most urgent assignment.'),
    ('16:00'::time, 'Light personal time'::varchar,                    'Personal'::varchar,  FALSE, 10, 'Avoid screens if possible.'),
    ('17:00'::time, 'EVENING NAP'::varchar,                            'PROTECTED'::varchar, TRUE,  11, '90 to 120 minutes. Fuels your overnight session.'),
    ('19:00'::time, 'Work session 3'::varchar,                         'Work'::varchar,      FALSE, 12, 'Any remaining daytime deadlines.'),
    ('21:00'::time, 'Break + meal'::varchar,                           'Break'::varchar,     FALSE, 13, 'Eat before the overnight push.'),
    ('22:00'::time, 'OVERNIGHT MAIN WORK SESSION'::varchar,            'Work'::varchar,      FALSE, 14, 'Longest and most intensive session.'),
    ('02:00'::time, 'Wind down'::varchar,                              'Personal'::varchar,  FALSE, 15, 'Stop adding new tasks. Wrap up what you are on.'),
    ('03:00'::time, 'Sleep'::varchar,                                  'PROTECTED'::varchar, TRUE,  16, 'Minimum 4 hours. Non-negotiable.')
) as t(start_time, label, block_type, is_protected, sort_order, notes)
WHERE NOT EXISTS (SELECT 1 FROM schedule_blocks);
