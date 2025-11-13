/**
 * OpenSearch API Types and Interfaces
 */

export interface SearchRequest {
  index?: string | string[];
  body?: any;
  type?: string;
  routing?: string;
  preference?: string;
  realtime?: boolean;
  refresh?: boolean;
  timeout?: string;
  size?: number;
  from?: number;
  sort?: string | string[] | Record<string, any>;
  _source?: boolean | string | string[];
  q?: string;
  analyzer?: string;
  analyze_wildcard?: boolean;
  default_operator?: 'AND' | 'OR';
  df?: string;
  explain?: boolean;
  stored_fields?: string | string[];
  docvalue_fields?: string | string[];
  fielddata_fields?: string | string[];
  highlight?: any;
  track_scores?: boolean;
  track_total_hits?: boolean | number;
  min_score?: number;
  terminate_after?: number;
  scroll?: string;
  scroll_size?: number;
  search_type?: 'query_then_fetch' | 'dfs_query_then_fetch';
  allow_no_indices?: boolean;
  expand_wildcards?: 'open' | 'closed' | 'hidden' | 'none' | 'all';
  ignore_unavailable?: boolean;
}

export interface SearchResponse<T = any> {
  took: number;
  timed_out: boolean;
  _shards: {
    total: number;
    successful: number;
    skipped: number;
    failed: number;
  };
  hits: {
    total: {
      value: number;
      relation: 'eq' | 'gte';
    };
    max_score: number | null;
    hits: Array<{
      _index: string;
      _type?: string;
      _id: string;
      _score: number | null;
      _source: T;
      highlight?: Record<string, string[]>;
      sort?: any[];
      fields?: Record<string, any>;
    }>;
  };
  aggregations?: Record<string, any>;
  suggest?: Record<string, any>;
  _scroll_id?: string;
}

export interface IndexRequest<T = any> {
  index: string;
  id?: string;
  body: T;
  type?: string;
  routing?: string;
  timeout?: string;
  refresh?: boolean | 'wait_for';
  wait_for_active_shards?: string | number;
  pipeline?: string;
  if_seq_no?: number;
  if_primary_term?: number;
  require_alias?: boolean;
}

export interface IndexResponse {
  _index: string;
  _type?: string;
  _id: string;
  _version: number;
  result: 'created' | 'updated' | 'deleted' | 'not_found' | 'noop';
  _shards: {
    total: number;
    successful: number;
    failed: number;
  };
  _seq_no: number;
  _primary_term: number;
}

export interface BulkRequest {
  index?: string;
  type?: string;
  body: any[];
  routing?: string;
  timeout?: string;
  refresh?: boolean | 'wait_for';
  wait_for_active_shards?: string | number;
  pipeline?: string;
  require_alias?: boolean;
}

export interface BulkResponse {
  took: number;
  errors: boolean;
  items: Array<{
    index?: BulkItemResponse;
    create?: BulkItemResponse;
    update?: BulkItemResponse;
    delete?: BulkItemResponse;
  }>;
}

export interface BulkItemResponse {
  _index: string;
  _type?: string;
  _id: string;
  _version?: number;
  result?: 'created' | 'updated' | 'deleted' | 'not_found' | 'noop';
  _shards?: {
    total: number;
    successful: number;
    failed: number;
  };
  _seq_no?: number;
  _primary_term?: number;
  status: number;
  error?: {
    type: string;
    reason: string;
    caused_by?: any;
  };
}

export interface GetRequest {
  index: string;
  id: string;
  type?: string;
  routing?: string;
  preference?: string;
  realtime?: boolean;
  refresh?: boolean;
  _source?: boolean | string | string[];
  _source_excludes?: string | string[];
  _source_includes?: string | string[];
  stored_fields?: string | string[];
  version?: number;
  version_type?: 'internal' | 'external' | 'external_gte' | 'force';
}

export interface GetResponse<T = any> {
  _index: string;
  _type?: string;
  _id: string;
  _version: number;
  _seq_no: number;
  _primary_term: number;
  found: boolean;
  _source?: T;
  fields?: Record<string, any>;
}

export interface DeleteRequest {
  index: string;
  id: string;
  type?: string;
  routing?: string;
  timeout?: string;
  refresh?: boolean | 'wait_for';
  wait_for_active_shards?: string | number;
  if_seq_no?: number;
  if_primary_term?: number;
  version?: number;
  version_type?: 'internal' | 'external' | 'external_gte' | 'force';
}

export interface DeleteResponse {
  _index: string;
  _type?: string;
  _id: string;
  _version: number;
  result: 'deleted' | 'not_found';
  _shards: {
    total: number;
    successful: number;
    failed: number;
  };
  _seq_no: number;
  _primary_term: number;
}

export interface UpdateRequest<T = any> {
  index: string;
  id: string;
  body: {
    doc?: Partial<T>;
    doc_as_upsert?: boolean;
    script?: {
      source: string;
      lang?: string;
      params?: Record<string, any>;
    };
    upsert?: T;
    _source?: boolean | string | string[];
  };
  type?: string;
  routing?: string;
  timeout?: string;
  refresh?: boolean | 'wait_for';
  wait_for_active_shards?: string | number;
  if_seq_no?: number;
  if_primary_term?: number;
  retry_on_conflict?: number;
}

export interface ClusterHealthResponse {
  cluster_name: string;
  status: 'green' | 'yellow' | 'red';
  timed_out: boolean;
  number_of_nodes: number;
  number_of_data_nodes: number;
  active_primary_shards: number;
  active_shards: number;
  relocating_shards: number;
  initializing_shards: number;
  unassigned_shards: number;
  delayed_unassigned_shards: number;
  number_of_pending_tasks: number;
  number_of_in_flight_fetch: number;
  task_max_waiting_in_queue_millis: number;
  active_shards_percent_as_number: number;
}

export interface ClusterStatsResponse {
  timestamp: number;
  cluster_name: string;
  cluster_uuid: string;
  status: 'green' | 'yellow' | 'red';
  indices: {
    count: number;
    shards: {
      total: number;
      primaries: number;
      replication: number;
      index: {
        shards: {
          min: number;
          max: number;
          avg: number;
        };
        primaries: {
          min: number;
          max: number;
          avg: number;
        };
        replication: {
          min: number;
          max: number;
          avg: number;
        };
      };
    };
    docs: {
      count: number;
      deleted: number;
    };
    store: {
      size_in_bytes: number;
    };
    fielddata: {
      memory_size_in_bytes: number;
      evictions: number;
    };
    query_cache: {
      memory_size_in_bytes: number;
      total_count: number;
      hit_count: number;
      miss_count: number;
      cache_size: number;
      cache_count: number;
      evictions: number;
    };
    completion: {
      size_in_bytes: number;
    };
    segments: {
      count: number;
      memory_in_bytes: number;
      terms_memory_in_bytes: number;
      stored_fields_memory_in_bytes: number;
      term_vectors_memory_in_bytes: number;
      norms_memory_in_bytes: number;
      points_memory_in_bytes: number;
      doc_values_memory_in_bytes: number;
      index_writer_memory_in_bytes: number;
      version_map_memory_in_bytes: number;
      fixed_bit_set_memory_in_bytes: number;
      max_unsafe_auto_id_timestamp: number;
      file_sizes: Record<string, any>;
    };
  };
  nodes: {
    count: {
      total: number;
      coordinating_only: number;
      data: number;
      ingest: number;
      master: number;
      ml: number;
      remote_cluster_client: number;
      transform: number;
    };
    versions: string[];
    os: {
      available_processors: number;
      allocated_processors: number;
      names: Array<{
        name: string;
        count: number;
      }>;
      pretty_names: Array<{
        pretty_name: string;
        count: number;
      }>;
      mem: {
        total_in_bytes: number;
        free_in_bytes: number;
        used_in_bytes: number;
        free_percent: number;
        used_percent: number;
      };
    };
    process: {
      cpu: {
        percent: number;
      };
      open_file_descriptors: {
        min: number;
        max: number;
        avg: number;
      };
    };
    jvm: {
      max_uptime_in_millis: number;
      versions: Array<{
        version: string;
        vm_name: string;
        vm_version: string;
        vm_vendor: string;
        bundled_jdk: boolean;
        using_bundled_jdk: boolean;
        count: number;
      }>;
      mem: {
        heap_used_in_bytes: number;
        heap_max_in_bytes: number;
      };
      threads: number;
    };
    fs: {
      total_in_bytes: number;
      free_in_bytes: number;
      available_in_bytes: number;
    };
    plugins: Array<{
      name: string;
      version: string;
      opensearch_version: string;
      java_version: string;
      description: string;
      classname: string;
      extended_plugins: string[];
      has_native_controller: boolean;
    }>;
    network_types: {
      transport_types: Record<string, number>;
      http_types: Record<string, number>;
    };
    discovery_types: Record<string, number>;
    packaging_types: Array<{
      flavor: string;
      type: string;
      count: number;
    }>;
    ingest: {
      number_of_pipelines: number;
      processor_stats: Record<string, any>;
    };
  };
}

export interface IndexStats {
  _shards: {
    total: number;
    successful: number;
    failed: number;
  };
  _all: {
    primaries: any;
    total: any;
  };
  indices: Record<string, {
    uuid: string;
    primaries: any;
    total: any;
  }>;
}

export interface CatIndicesResponse {
  health: 'green' | 'yellow' | 'red';
  status: 'open' | 'close';
  index: string;
  uuid: string;
  pri: string;
  rep: string;
  'docs.count': string;
  'docs.deleted': string;
  'store.size': string;
  'pri.store.size': string;
}

export interface Mapping {
  properties: Record<string, MappingProperty>;
  dynamic?: boolean | 'strict' | 'runtime';
  dynamic_templates?: DynamicTemplate[];
  _source?: {
    enabled?: boolean;
    includes?: string[];
    excludes?: string[];
  };
  _routing?: {
    required?: boolean;
  };
}

export interface MappingProperty {
  type?: string;
  analyzer?: string;
  search_analyzer?: string;
  index?: boolean;
  store?: boolean;
  doc_values?: boolean;
  term_vector?: string;
  boost?: number;
  null_value?: any;
  copy_to?: string | string[];
  fields?: Record<string, MappingProperty>;
  properties?: Record<string, MappingProperty>;
  format?: string;
  ignore_malformed?: boolean;
  coerce?: boolean;
  similarity?: string;
  fielddata?: boolean | {
    frequency_filter?: {
      min?: number;
      max?: number;
      min_segment_size?: number;
    };
  };
  eager_global_ordinals?: boolean;
  index_options?: 'docs' | 'freqs' | 'positions' | 'offsets';
  norms?: boolean;
  position_increment_gap?: number;
  search_quote_analyzer?: string;
  include_in_all?: boolean;
}

export interface DynamicTemplate {
  [templateName: string]: {
    match?: string;
    unmatch?: string;
    match_mapping_type?: string;
    path_match?: string;
    path_unmatch?: string;
    mapping: MappingProperty;
  };
}

export interface IndexSettings {
  index?: {
    number_of_shards?: number;
    number_of_replicas?: number;
    refresh_interval?: string;
    max_result_window?: number;
    max_inner_result_window?: number;
    max_rescore_window?: number;
    max_docvalue_fields_search?: number;
    max_script_fields?: number;
    max_ngram_diff?: number;
    max_shingle_diff?: number;
    max_refresh_listeners?: number;
    analyze?: {
      max_token_count?: number;
    };
    highlight?: {
      max_analyzed_offset?: number;
    };
    max_terms_count?: number;
    max_regex_length?: number;
    routing?: {
      allocation?: {
        enable?: 'all' | 'primaries' | 'new_primaries' | 'none';
      };
    };
    gc_deletes?: string;
    default_pipeline?: string;
    final_pipeline?: string;
  };
  [key: string]: any;
}