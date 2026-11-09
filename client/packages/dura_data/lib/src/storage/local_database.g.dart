// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'local_database.dart';

// ignore_for_file: type=lint
class $AppPreferencesTable extends AppPreferences
    with TableInfo<$AppPreferencesTable, AppPreference> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $AppPreferencesTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _keyMeta = const VerificationMeta('key');
  @override
  late final GeneratedColumn<String> key = GeneratedColumn<String>(
    'key',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _valueMeta = const VerificationMeta('value');
  @override
  late final GeneratedColumn<String> value = GeneratedColumn<String>(
    'value',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  @override
  List<GeneratedColumn> get $columns => [key, value];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'app_preferences';
  @override
  VerificationContext validateIntegrity(
    Insertable<AppPreference> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('key')) {
      context.handle(
        _keyMeta,
        key.isAcceptableOrUnknown(data['key']!, _keyMeta),
      );
    } else if (isInserting) {
      context.missing(_keyMeta);
    }
    if (data.containsKey('value')) {
      context.handle(
        _valueMeta,
        value.isAcceptableOrUnknown(data['value']!, _valueMeta),
      );
    } else if (isInserting) {
      context.missing(_valueMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {key};
  @override
  AppPreference map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return AppPreference(
      key: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}key'],
      )!,
      value: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}value'],
      )!,
    );
  }

  @override
  $AppPreferencesTable createAlias(String alias) {
    return $AppPreferencesTable(attachedDatabase, alias);
  }
}

class AppPreference extends DataClass implements Insertable<AppPreference> {
  final String key;
  final String value;
  const AppPreference({required this.key, required this.value});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['key'] = Variable<String>(key);
    map['value'] = Variable<String>(value);
    return map;
  }

  AppPreferencesCompanion toCompanion(bool nullToAbsent) {
    return AppPreferencesCompanion(key: Value(key), value: Value(value));
  }

  factory AppPreference.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return AppPreference(
      key: serializer.fromJson<String>(json['key']),
      value: serializer.fromJson<String>(json['value']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'key': serializer.toJson<String>(key),
      'value': serializer.toJson<String>(value),
    };
  }

  AppPreference copyWith({String? key, String? value}) =>
      AppPreference(key: key ?? this.key, value: value ?? this.value);
  AppPreference copyWithCompanion(AppPreferencesCompanion data) {
    return AppPreference(
      key: data.key.present ? data.key.value : this.key,
      value: data.value.present ? data.value.value : this.value,
    );
  }

  @override
  String toString() {
    return (StringBuffer('AppPreference(')
          ..write('key: $key, ')
          ..write('value: $value')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(key, value);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is AppPreference &&
          other.key == this.key &&
          other.value == this.value);
}

class AppPreferencesCompanion extends UpdateCompanion<AppPreference> {
  final Value<String> key;
  final Value<String> value;
  final Value<int> rowid;
  const AppPreferencesCompanion({
    this.key = const Value.absent(),
    this.value = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  AppPreferencesCompanion.insert({
    required String key,
    required String value,
    this.rowid = const Value.absent(),
  }) : key = Value(key),
       value = Value(value);
  static Insertable<AppPreference> custom({
    Expression<String>? key,
    Expression<String>? value,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (key != null) 'key': key,
      if (value != null) 'value': value,
      if (rowid != null) 'rowid': rowid,
    });
  }

  AppPreferencesCompanion copyWith({
    Value<String>? key,
    Value<String>? value,
    Value<int>? rowid,
  }) {
    return AppPreferencesCompanion(
      key: key ?? this.key,
      value: value ?? this.value,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (key.present) {
      map['key'] = Variable<String>(key.value);
    }
    if (value.present) {
      map['value'] = Variable<String>(value.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('AppPreferencesCompanion(')
          ..write('key: $key, ')
          ..write('value: $value, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $OutboxEventsTable extends OutboxEvents
    with TableInfo<$OutboxEventsTable, OutboxEvent> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $OutboxEventsTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _sequenceMeta = const VerificationMeta(
    'sequence',
  );
  @override
  late final GeneratedColumn<int> sequence = GeneratedColumn<int>(
    'sequence',
    aliasedName,
    false,
    hasAutoIncrement: true,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'PRIMARY KEY AUTOINCREMENT',
    ),
  );
  static const VerificationMeta _eventIdMeta = const VerificationMeta(
    'eventId',
  );
  @override
  late final GeneratedColumn<String> eventId = GeneratedColumn<String>(
    'event_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
    defaultConstraints: GeneratedColumn.constraintIsAlways('UNIQUE'),
  );
  static const VerificationMeta _payloadMeta = const VerificationMeta(
    'payload',
  );
  @override
  late final GeneratedColumn<String> payload = GeneratedColumn<String>(
    'payload',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _batchNumberMeta = const VerificationMeta(
    'batchNumber',
  );
  @override
  late final GeneratedColumn<int> batchNumber = GeneratedColumn<int>(
    'batch_number',
    aliasedName,
    true,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
  );
  @override
  List<GeneratedColumn> get $columns => [
    sequence,
    eventId,
    payload,
    batchNumber,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'outbox_events';
  @override
  VerificationContext validateIntegrity(
    Insertable<OutboxEvent> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('sequence')) {
      context.handle(
        _sequenceMeta,
        sequence.isAcceptableOrUnknown(data['sequence']!, _sequenceMeta),
      );
    }
    if (data.containsKey('event_id')) {
      context.handle(
        _eventIdMeta,
        eventId.isAcceptableOrUnknown(data['event_id']!, _eventIdMeta),
      );
    } else if (isInserting) {
      context.missing(_eventIdMeta);
    }
    if (data.containsKey('payload')) {
      context.handle(
        _payloadMeta,
        payload.isAcceptableOrUnknown(data['payload']!, _payloadMeta),
      );
    } else if (isInserting) {
      context.missing(_payloadMeta);
    }
    if (data.containsKey('batch_number')) {
      context.handle(
        _batchNumberMeta,
        batchNumber.isAcceptableOrUnknown(
          data['batch_number']!,
          _batchNumberMeta,
        ),
      );
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {sequence};
  @override
  OutboxEvent map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return OutboxEvent(
      sequence: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}sequence'],
      )!,
      eventId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}event_id'],
      )!,
      payload: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}payload'],
      )!,
      batchNumber: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}batch_number'],
      ),
    );
  }

  @override
  $OutboxEventsTable createAlias(String alias) {
    return $OutboxEventsTable(attachedDatabase, alias);
  }
}

class OutboxEvent extends DataClass implements Insertable<OutboxEvent> {
  final int sequence;
  final String eventId;
  final String payload;
  final int? batchNumber;
  const OutboxEvent({
    required this.sequence,
    required this.eventId,
    required this.payload,
    this.batchNumber,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['sequence'] = Variable<int>(sequence);
    map['event_id'] = Variable<String>(eventId);
    map['payload'] = Variable<String>(payload);
    if (!nullToAbsent || batchNumber != null) {
      map['batch_number'] = Variable<int>(batchNumber);
    }
    return map;
  }

  OutboxEventsCompanion toCompanion(bool nullToAbsent) {
    return OutboxEventsCompanion(
      sequence: Value(sequence),
      eventId: Value(eventId),
      payload: Value(payload),
      batchNumber: batchNumber == null && nullToAbsent
          ? const Value.absent()
          : Value(batchNumber),
    );
  }

  factory OutboxEvent.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return OutboxEvent(
      sequence: serializer.fromJson<int>(json['sequence']),
      eventId: serializer.fromJson<String>(json['eventId']),
      payload: serializer.fromJson<String>(json['payload']),
      batchNumber: serializer.fromJson<int?>(json['batchNumber']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'sequence': serializer.toJson<int>(sequence),
      'eventId': serializer.toJson<String>(eventId),
      'payload': serializer.toJson<String>(payload),
      'batchNumber': serializer.toJson<int?>(batchNumber),
    };
  }

  OutboxEvent copyWith({
    int? sequence,
    String? eventId,
    String? payload,
    Value<int?> batchNumber = const Value.absent(),
  }) => OutboxEvent(
    sequence: sequence ?? this.sequence,
    eventId: eventId ?? this.eventId,
    payload: payload ?? this.payload,
    batchNumber: batchNumber.present ? batchNumber.value : this.batchNumber,
  );
  OutboxEvent copyWithCompanion(OutboxEventsCompanion data) {
    return OutboxEvent(
      sequence: data.sequence.present ? data.sequence.value : this.sequence,
      eventId: data.eventId.present ? data.eventId.value : this.eventId,
      payload: data.payload.present ? data.payload.value : this.payload,
      batchNumber: data.batchNumber.present
          ? data.batchNumber.value
          : this.batchNumber,
    );
  }

  @override
  String toString() {
    return (StringBuffer('OutboxEvent(')
          ..write('sequence: $sequence, ')
          ..write('eventId: $eventId, ')
          ..write('payload: $payload, ')
          ..write('batchNumber: $batchNumber')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(sequence, eventId, payload, batchNumber);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is OutboxEvent &&
          other.sequence == this.sequence &&
          other.eventId == this.eventId &&
          other.payload == this.payload &&
          other.batchNumber == this.batchNumber);
}

class OutboxEventsCompanion extends UpdateCompanion<OutboxEvent> {
  final Value<int> sequence;
  final Value<String> eventId;
  final Value<String> payload;
  final Value<int?> batchNumber;
  const OutboxEventsCompanion({
    this.sequence = const Value.absent(),
    this.eventId = const Value.absent(),
    this.payload = const Value.absent(),
    this.batchNumber = const Value.absent(),
  });
  OutboxEventsCompanion.insert({
    this.sequence = const Value.absent(),
    required String eventId,
    required String payload,
    this.batchNumber = const Value.absent(),
  }) : eventId = Value(eventId),
       payload = Value(payload);
  static Insertable<OutboxEvent> custom({
    Expression<int>? sequence,
    Expression<String>? eventId,
    Expression<String>? payload,
    Expression<int>? batchNumber,
  }) {
    return RawValuesInsertable({
      if (sequence != null) 'sequence': sequence,
      if (eventId != null) 'event_id': eventId,
      if (payload != null) 'payload': payload,
      if (batchNumber != null) 'batch_number': batchNumber,
    });
  }

  OutboxEventsCompanion copyWith({
    Value<int>? sequence,
    Value<String>? eventId,
    Value<String>? payload,
    Value<int?>? batchNumber,
  }) {
    return OutboxEventsCompanion(
      sequence: sequence ?? this.sequence,
      eventId: eventId ?? this.eventId,
      payload: payload ?? this.payload,
      batchNumber: batchNumber ?? this.batchNumber,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (sequence.present) {
      map['sequence'] = Variable<int>(sequence.value);
    }
    if (eventId.present) {
      map['event_id'] = Variable<String>(eventId.value);
    }
    if (payload.present) {
      map['payload'] = Variable<String>(payload.value);
    }
    if (batchNumber.present) {
      map['batch_number'] = Variable<int>(batchNumber.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('OutboxEventsCompanion(')
          ..write('sequence: $sequence, ')
          ..write('eventId: $eventId, ')
          ..write('payload: $payload, ')
          ..write('batchNumber: $batchNumber')
          ..write(')'))
        .toString();
  }
}

class $SealedBatchesTable extends SealedBatches
    with TableInfo<$SealedBatchesTable, SealedBatche> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $SealedBatchesTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _numberMeta = const VerificationMeta('number');
  @override
  late final GeneratedColumn<int> number = GeneratedColumn<int>(
    'number',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _eventsMeta = const VerificationMeta('events');
  @override
  late final GeneratedColumn<String> events = GeneratedColumn<String>(
    'events',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _uploadedMeta = const VerificationMeta(
    'uploaded',
  );
  @override
  late final GeneratedColumn<bool> uploaded = GeneratedColumn<bool>(
    'uploaded',
    aliasedName,
    false,
    type: DriftSqlType.bool,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'CHECK ("uploaded" IN (0, 1))',
    ),
    defaultValue: const Constant(false),
  );
  @override
  List<GeneratedColumn> get $columns => [number, events, uploaded];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'sealed_batches';
  @override
  VerificationContext validateIntegrity(
    Insertable<SealedBatche> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('number')) {
      context.handle(
        _numberMeta,
        number.isAcceptableOrUnknown(data['number']!, _numberMeta),
      );
    }
    if (data.containsKey('events')) {
      context.handle(
        _eventsMeta,
        events.isAcceptableOrUnknown(data['events']!, _eventsMeta),
      );
    } else if (isInserting) {
      context.missing(_eventsMeta);
    }
    if (data.containsKey('uploaded')) {
      context.handle(
        _uploadedMeta,
        uploaded.isAcceptableOrUnknown(data['uploaded']!, _uploadedMeta),
      );
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {number};
  @override
  SealedBatche map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return SealedBatche(
      number: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}number'],
      )!,
      events: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}events'],
      )!,
      uploaded: attachedDatabase.typeMapping.read(
        DriftSqlType.bool,
        data['${effectivePrefix}uploaded'],
      )!,
    );
  }

  @override
  $SealedBatchesTable createAlias(String alias) {
    return $SealedBatchesTable(attachedDatabase, alias);
  }
}

class SealedBatche extends DataClass implements Insertable<SealedBatche> {
  final int number;
  final String events;
  final bool uploaded;
  const SealedBatche({
    required this.number,
    required this.events,
    required this.uploaded,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['number'] = Variable<int>(number);
    map['events'] = Variable<String>(events);
    map['uploaded'] = Variable<bool>(uploaded);
    return map;
  }

  SealedBatchesCompanion toCompanion(bool nullToAbsent) {
    return SealedBatchesCompanion(
      number: Value(number),
      events: Value(events),
      uploaded: Value(uploaded),
    );
  }

  factory SealedBatche.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return SealedBatche(
      number: serializer.fromJson<int>(json['number']),
      events: serializer.fromJson<String>(json['events']),
      uploaded: serializer.fromJson<bool>(json['uploaded']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'number': serializer.toJson<int>(number),
      'events': serializer.toJson<String>(events),
      'uploaded': serializer.toJson<bool>(uploaded),
    };
  }

  SealedBatche copyWith({int? number, String? events, bool? uploaded}) =>
      SealedBatche(
        number: number ?? this.number,
        events: events ?? this.events,
        uploaded: uploaded ?? this.uploaded,
      );
  SealedBatche copyWithCompanion(SealedBatchesCompanion data) {
    return SealedBatche(
      number: data.number.present ? data.number.value : this.number,
      events: data.events.present ? data.events.value : this.events,
      uploaded: data.uploaded.present ? data.uploaded.value : this.uploaded,
    );
  }

  @override
  String toString() {
    return (StringBuffer('SealedBatche(')
          ..write('number: $number, ')
          ..write('events: $events, ')
          ..write('uploaded: $uploaded')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(number, events, uploaded);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is SealedBatche &&
          other.number == this.number &&
          other.events == this.events &&
          other.uploaded == this.uploaded);
}

class SealedBatchesCompanion extends UpdateCompanion<SealedBatche> {
  final Value<int> number;
  final Value<String> events;
  final Value<bool> uploaded;
  const SealedBatchesCompanion({
    this.number = const Value.absent(),
    this.events = const Value.absent(),
    this.uploaded = const Value.absent(),
  });
  SealedBatchesCompanion.insert({
    this.number = const Value.absent(),
    required String events,
    this.uploaded = const Value.absent(),
  }) : events = Value(events);
  static Insertable<SealedBatche> custom({
    Expression<int>? number,
    Expression<String>? events,
    Expression<bool>? uploaded,
  }) {
    return RawValuesInsertable({
      if (number != null) 'number': number,
      if (events != null) 'events': events,
      if (uploaded != null) 'uploaded': uploaded,
    });
  }

  SealedBatchesCompanion copyWith({
    Value<int>? number,
    Value<String>? events,
    Value<bool>? uploaded,
  }) {
    return SealedBatchesCompanion(
      number: number ?? this.number,
      events: events ?? this.events,
      uploaded: uploaded ?? this.uploaded,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (number.present) {
      map['number'] = Variable<int>(number.value);
    }
    if (events.present) {
      map['events'] = Variable<String>(events.value);
    }
    if (uploaded.present) {
      map['uploaded'] = Variable<bool>(uploaded.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('SealedBatchesCompanion(')
          ..write('number: $number, ')
          ..write('events: $events, ')
          ..write('uploaded: $uploaded')
          ..write(')'))
        .toString();
  }
}

abstract class _$LocalDatabase extends GeneratedDatabase {
  _$LocalDatabase(QueryExecutor e) : super(e);
  $LocalDatabaseManager get managers => $LocalDatabaseManager(this);
  late final $AppPreferencesTable appPreferences = $AppPreferencesTable(this);
  late final $OutboxEventsTable outboxEvents = $OutboxEventsTable(this);
  late final $SealedBatchesTable sealedBatches = $SealedBatchesTable(this);
  @override
  Iterable<TableInfo<Table, Object?>> get allTables =>
      allSchemaEntities.whereType<TableInfo<Table, Object?>>();
  @override
  List<DatabaseSchemaEntity> get allSchemaEntities => [
    appPreferences,
    outboxEvents,
    sealedBatches,
  ];
}

typedef $$AppPreferencesTableCreateCompanionBuilder =
    AppPreferencesCompanion Function({
      required String key,
      required String value,
      Value<int> rowid,
    });
typedef $$AppPreferencesTableUpdateCompanionBuilder =
    AppPreferencesCompanion Function({
      Value<String> key,
      Value<String> value,
      Value<int> rowid,
    });

class $$AppPreferencesTableFilterComposer
    extends Composer<_$LocalDatabase, $AppPreferencesTable> {
  $$AppPreferencesTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get key => $composableBuilder(
    column: $table.key,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get value => $composableBuilder(
    column: $table.value,
    builder: (column) => ColumnFilters(column),
  );
}

class $$AppPreferencesTableOrderingComposer
    extends Composer<_$LocalDatabase, $AppPreferencesTable> {
  $$AppPreferencesTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get key => $composableBuilder(
    column: $table.key,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get value => $composableBuilder(
    column: $table.value,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$AppPreferencesTableAnnotationComposer
    extends Composer<_$LocalDatabase, $AppPreferencesTable> {
  $$AppPreferencesTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get key =>
      $composableBuilder(column: $table.key, builder: (column) => column);

  GeneratedColumn<String> get value =>
      $composableBuilder(column: $table.value, builder: (column) => column);
}

class $$AppPreferencesTableTableManager
    extends
        RootTableManager<
          _$LocalDatabase,
          $AppPreferencesTable,
          AppPreference,
          $$AppPreferencesTableFilterComposer,
          $$AppPreferencesTableOrderingComposer,
          $$AppPreferencesTableAnnotationComposer,
          $$AppPreferencesTableCreateCompanionBuilder,
          $$AppPreferencesTableUpdateCompanionBuilder,
          (
            AppPreference,
            BaseReferences<
              _$LocalDatabase,
              $AppPreferencesTable,
              AppPreference
            >,
          ),
          AppPreference,
          PrefetchHooks Function()
        > {
  $$AppPreferencesTableTableManager(
    _$LocalDatabase db,
    $AppPreferencesTable table,
  ) : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$AppPreferencesTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$AppPreferencesTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$AppPreferencesTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback: ({
            Value<String> key = const Value.absent(),
            Value<String> value = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) => AppPreferencesCompanion(key: key, value: value, rowid: rowid),
          createCompanionCallback:
              ({
                required String key,
                required String value,
                Value<int> rowid = const Value.absent(),
              }) => AppPreferencesCompanion.insert(
                key: key,
                value: value,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map(
                (e) => (
                  e.readTable<$AppPreferencesTable, AppPreference>(table),
                  BaseReferences<
                    _$LocalDatabase,
                    $AppPreferencesTable,
                    AppPreference
                  >(db, table, e),
                ),
              )
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$AppPreferencesTableProcessedTableManager =
    ProcessedTableManager<
      _$LocalDatabase,
      $AppPreferencesTable,
      AppPreference,
      $$AppPreferencesTableFilterComposer,
      $$AppPreferencesTableOrderingComposer,
      $$AppPreferencesTableAnnotationComposer,
      $$AppPreferencesTableCreateCompanionBuilder,
      $$AppPreferencesTableUpdateCompanionBuilder,
      (
        AppPreference,
        BaseReferences<_$LocalDatabase, $AppPreferencesTable, AppPreference>,
      ),
      AppPreference,
      PrefetchHooks Function()
    >;
typedef $$OutboxEventsTableCreateCompanionBuilder =
    OutboxEventsCompanion Function({
      Value<int> sequence,
      required String eventId,
      required String payload,
      Value<int?> batchNumber,
    });
typedef $$OutboxEventsTableUpdateCompanionBuilder =
    OutboxEventsCompanion Function({
      Value<int> sequence,
      Value<String> eventId,
      Value<String> payload,
      Value<int?> batchNumber,
    });

class $$OutboxEventsTableFilterComposer
    extends Composer<_$LocalDatabase, $OutboxEventsTable> {
  $$OutboxEventsTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<int> get sequence => $composableBuilder(
    column: $table.sequence,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get eventId => $composableBuilder(
    column: $table.eventId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get payload => $composableBuilder(
    column: $table.payload,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get batchNumber => $composableBuilder(
    column: $table.batchNumber,
    builder: (column) => ColumnFilters(column),
  );
}

class $$OutboxEventsTableOrderingComposer
    extends Composer<_$LocalDatabase, $OutboxEventsTable> {
  $$OutboxEventsTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<int> get sequence => $composableBuilder(
    column: $table.sequence,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get eventId => $composableBuilder(
    column: $table.eventId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get payload => $composableBuilder(
    column: $table.payload,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get batchNumber => $composableBuilder(
    column: $table.batchNumber,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$OutboxEventsTableAnnotationComposer
    extends Composer<_$LocalDatabase, $OutboxEventsTable> {
  $$OutboxEventsTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<int> get sequence =>
      $composableBuilder(column: $table.sequence, builder: (column) => column);

  GeneratedColumn<String> get eventId =>
      $composableBuilder(column: $table.eventId, builder: (column) => column);

  GeneratedColumn<String> get payload =>
      $composableBuilder(column: $table.payload, builder: (column) => column);

  GeneratedColumn<int> get batchNumber => $composableBuilder(
    column: $table.batchNumber,
    builder: (column) => column,
  );
}

class $$OutboxEventsTableTableManager
    extends
        RootTableManager<
          _$LocalDatabase,
          $OutboxEventsTable,
          OutboxEvent,
          $$OutboxEventsTableFilterComposer,
          $$OutboxEventsTableOrderingComposer,
          $$OutboxEventsTableAnnotationComposer,
          $$OutboxEventsTableCreateCompanionBuilder,
          $$OutboxEventsTableUpdateCompanionBuilder,
          (
            OutboxEvent,
            BaseReferences<_$LocalDatabase, $OutboxEventsTable, OutboxEvent>,
          ),
          OutboxEvent,
          PrefetchHooks Function()
        > {
  $$OutboxEventsTableTableManager(_$LocalDatabase db, $OutboxEventsTable table)
    : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$OutboxEventsTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$OutboxEventsTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$OutboxEventsTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<int> sequence = const Value.absent(),
                Value<String> eventId = const Value.absent(),
                Value<String> payload = const Value.absent(),
                Value<int?> batchNumber = const Value.absent(),
              }) => OutboxEventsCompanion(
                sequence: sequence,
                eventId: eventId,
                payload: payload,
                batchNumber: batchNumber,
              ),
          createCompanionCallback:
              ({
                Value<int> sequence = const Value.absent(),
                required String eventId,
                required String payload,
                Value<int?> batchNumber = const Value.absent(),
              }) => OutboxEventsCompanion.insert(
                sequence: sequence,
                eventId: eventId,
                payload: payload,
                batchNumber: batchNumber,
              ),
          withReferenceMapper: (p0) => p0
              .map(
                (e) => (
                  e.readTable<$OutboxEventsTable, OutboxEvent>(table),
                  BaseReferences<
                    _$LocalDatabase,
                    $OutboxEventsTable,
                    OutboxEvent
                  >(db, table, e),
                ),
              )
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$OutboxEventsTableProcessedTableManager =
    ProcessedTableManager<
      _$LocalDatabase,
      $OutboxEventsTable,
      OutboxEvent,
      $$OutboxEventsTableFilterComposer,
      $$OutboxEventsTableOrderingComposer,
      $$OutboxEventsTableAnnotationComposer,
      $$OutboxEventsTableCreateCompanionBuilder,
      $$OutboxEventsTableUpdateCompanionBuilder,
      (
        OutboxEvent,
        BaseReferences<_$LocalDatabase, $OutboxEventsTable, OutboxEvent>,
      ),
      OutboxEvent,
      PrefetchHooks Function()
    >;
typedef $$SealedBatchesTableCreateCompanionBuilder =
    SealedBatchesCompanion Function({
      Value<int> number,
      required String events,
      Value<bool> uploaded,
    });
typedef $$SealedBatchesTableUpdateCompanionBuilder =
    SealedBatchesCompanion Function({
      Value<int> number,
      Value<String> events,
      Value<bool> uploaded,
    });

class $$SealedBatchesTableFilterComposer
    extends Composer<_$LocalDatabase, $SealedBatchesTable> {
  $$SealedBatchesTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<int> get number => $composableBuilder(
    column: $table.number,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get events => $composableBuilder(
    column: $table.events,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<bool> get uploaded => $composableBuilder(
    column: $table.uploaded,
    builder: (column) => ColumnFilters(column),
  );
}

class $$SealedBatchesTableOrderingComposer
    extends Composer<_$LocalDatabase, $SealedBatchesTable> {
  $$SealedBatchesTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<int> get number => $composableBuilder(
    column: $table.number,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get events => $composableBuilder(
    column: $table.events,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<bool> get uploaded => $composableBuilder(
    column: $table.uploaded,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$SealedBatchesTableAnnotationComposer
    extends Composer<_$LocalDatabase, $SealedBatchesTable> {
  $$SealedBatchesTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<int> get number =>
      $composableBuilder(column: $table.number, builder: (column) => column);

  GeneratedColumn<String> get events =>
      $composableBuilder(column: $table.events, builder: (column) => column);

  GeneratedColumn<bool> get uploaded =>
      $composableBuilder(column: $table.uploaded, builder: (column) => column);
}

class $$SealedBatchesTableTableManager
    extends
        RootTableManager<
          _$LocalDatabase,
          $SealedBatchesTable,
          SealedBatche,
          $$SealedBatchesTableFilterComposer,
          $$SealedBatchesTableOrderingComposer,
          $$SealedBatchesTableAnnotationComposer,
          $$SealedBatchesTableCreateCompanionBuilder,
          $$SealedBatchesTableUpdateCompanionBuilder,
          (
            SealedBatche,
            BaseReferences<_$LocalDatabase, $SealedBatchesTable, SealedBatche>,
          ),
          SealedBatche,
          PrefetchHooks Function()
        > {
  $$SealedBatchesTableTableManager(
    _$LocalDatabase db,
    $SealedBatchesTable table,
  ) : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$SealedBatchesTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$SealedBatchesTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$SealedBatchesTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<int> number = const Value.absent(),
                Value<String> events = const Value.absent(),
                Value<bool> uploaded = const Value.absent(),
              }) => SealedBatchesCompanion(
                number: number,
                events: events,
                uploaded: uploaded,
              ),
          createCompanionCallback:
              ({
                Value<int> number = const Value.absent(),
                required String events,
                Value<bool> uploaded = const Value.absent(),
              }) => SealedBatchesCompanion.insert(
                number: number,
                events: events,
                uploaded: uploaded,
              ),
          withReferenceMapper: (p0) => p0
              .map(
                (e) => (
                  e.readTable<$SealedBatchesTable, SealedBatche>(table),
                  BaseReferences<
                    _$LocalDatabase,
                    $SealedBatchesTable,
                    SealedBatche
                  >(db, table, e),
                ),
              )
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$SealedBatchesTableProcessedTableManager =
    ProcessedTableManager<
      _$LocalDatabase,
      $SealedBatchesTable,
      SealedBatche,
      $$SealedBatchesTableFilterComposer,
      $$SealedBatchesTableOrderingComposer,
      $$SealedBatchesTableAnnotationComposer,
      $$SealedBatchesTableCreateCompanionBuilder,
      $$SealedBatchesTableUpdateCompanionBuilder,
      (
        SealedBatche,
        BaseReferences<_$LocalDatabase, $SealedBatchesTable, SealedBatche>,
      ),
      SealedBatche,
      PrefetchHooks Function()
    >;

class $LocalDatabaseManager {
  final _$LocalDatabase _db;
  $LocalDatabaseManager(this._db);
  $$AppPreferencesTableTableManager get appPreferences =>
      $$AppPreferencesTableTableManager(_db, _db.appPreferences);
  $$OutboxEventsTableTableManager get outboxEvents =>
      $$OutboxEventsTableTableManager(_db, _db.outboxEvents);
  $$SealedBatchesTableTableManager get sealedBatches =>
      $$SealedBatchesTableTableManager(_db, _db.sealedBatches);
}
