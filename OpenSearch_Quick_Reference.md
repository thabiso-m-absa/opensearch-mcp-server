# OpenSearch Quick Reference Guide

_Essential Commands & Procedures_

---

## 🚀 Common Operations

### Cluster Health Check

```bash
# Basic health check
curl -X GET "https://your-opensearch-cluster:9200/_cluster/health?pretty"

# Detailed node information
curl -X GET "https://your-opensearch-cluster:9200/_cat/nodes?v"

# Index statistics
curl -X GET "https://your-opensearch-cluster:9200/_cat/indices?v&s=store.size:desc"
```

### Memory Management

```bash
# Check heap usage
curl -X GET "https://your-opensearch-cluster:9200/_cat/nodes?v&h=name,heap.percent,heap.current,heap.max"

# Clear field data cache
curl -X POST "https://your-opensearch-cluster:9200/_cache/clear?fielddata=true"

# Clear query cache
curl -X POST "https://your-opensearch-cluster:9200/_cache/clear?query=true"
```

### Index Management

```bash
# List all indices by size
curl -X GET "https://your-opensearch-cluster:9200/_cat/indices?v&s=store.size:desc&h=index,docs.count,store.size"

# Delete old indices (be careful!)
curl -X DELETE "https://your-opensearch-cluster:9200/old-index-name"

# Close unused indices (saves memory)
curl -X POST "https://your-opensearch-cluster:9200/index-name/_close"

# Reopen closed indices
curl -X POST "https://your-opensearch-cluster:9200/index-name/_open"
```

---

## 🔧 Troubleshooting Procedures

### High Memory Usage (>95%)

1. **Immediate Actions:**

   ```bash
   # Check what's consuming memory
   curl -X GET "https://your-opensearch-cluster:9200/_nodes/stats/jvm"

   # Clear caches
   curl -X POST "https://your-opensearch-cluster:9200/_cache/clear"

   # Force garbage collection
   curl -X POST "https://your-opensearch-cluster:9200/_nodes/_local/jvm"
   ```

2. **Short-term Fixes:**

   - Close rarely used indices
   - Reduce field data cache size
   - Restart nodes one by one

3. **Long-term Solutions:**
   - Increase JVM heap size
   - Add more nodes
   - Implement index lifecycle management

### Slow Query Performance

1. **Diagnose:**

   ```bash
   # Check current queries
   curl -X GET "https://your-opensearch-cluster:9200/_tasks?actions=*search*&detailed"

   # Profile slow queries
   curl -X POST "https://your-opensearch-cluster:9200/index-name/_search?profile=true"
   ```

2. **Optimize:**
   - Add filters before queries
   - Use appropriate shard count
   - Review field mappings

### Disk Space Issues

1. **Check Usage:**

   ```bash
   # Disk usage by node
   curl -X GET "https://your-opensearch-cluster:9200/_cat/allocation?v"

   # Detailed disk info
   curl -X GET "https://your-opensearch-cluster:9200/_nodes/stats/fs"
   ```

2. **Free Space:**
   - Delete old indices
   - Force merge segments
   - Archive data to cold storage

---

## 📊 Monitoring Queries

### Daily Health Check

```bash
#!/bin/bash
echo "=== OpenSearch Daily Health Check ==="
echo "Date: $(date)"
echo

echo "Cluster Status:"
curl -s "https://your-opensearch-cluster:9200/_cluster/health" | jq '.status, .number_of_nodes, .active_primary_shards'

echo -e "\nMemory Usage:"
curl -s "https://your-opensearch-cluster:9200/_cat/nodes?h=name,heap.percent" | head -5

echo -e "\nLargest Indices:"
curl -s "https://your-opensearch-cluster:9200/_cat/indices?s=store.size:desc&h=index,store.size" | head -10

echo -e "\nActive Tasks:"
curl -s "https://your-opensearch-cluster:9200/_tasks" | jq '.tasks | length'
```

### Performance Metrics

```bash
# Search performance
curl -X GET "https://your-opensearch-cluster:9200/_nodes/stats/indices/search"

# Indexing performance
curl -X GET "https://your-opensearch-cluster:9200/_nodes/stats/indices/indexing"

# Current thread pool status
curl -X GET "https://your-opensearch-cluster:9200/_cat/thread_pool?v&h=node_name,name,active,queue,rejected"
```

---

## ⚙️ Index Lifecycle Policies

### Create ILM Policy for Log Data

```json
{
  "policy": {
    "description": "Log data lifecycle policy",
    "phases": {
      "hot": {
        "actions": {
          "rollover": {
            "max_size": "50GB",
            "max_age": "7d"
          }
        }
      },
      "warm": {
        "min_age": "7d",
        "actions": {
          "allocate": {
            "number_of_replicas": 0
          }
        }
      },
      "cold": {
        "min_age": "30d",
        "actions": {
          "allocate": {
            "number_of_replicas": 0
          }
        }
      },
      "delete": {
        "min_age": "90d"
      }
    }
  }
}
```

### Apply Policy to Index Pattern

```bash
curl -X PUT "https://your-opensearch-cluster:9200/_template/log-template" \
-H "Content-Type: application/json" \
-d '{
  "index_patterns": ["logs-*"],
  "settings": {
    "opendistro.index_state_management.policy_id": "log-policy",
    "number_of_shards": 3,
    "number_of_replicas": 1
  }
}'
```

---

## 🚨 Emergency Procedures

### Node Failure Response

1. **Check cluster status immediately**
2. **Identify failed node:**
   ```bash
   curl -X GET "https://your-opensearch-cluster:9200/_cat/nodes?v"
   ```
3. **Check shard allocation:**
   ```bash
   curl -X GET "https://your-opensearch-cluster:9200/_cat/shards?v&h=index,shard,prirep,state,node"
   ```
4. **If node is temporarily down, wait for auto-recovery**
5. **If permanent failure, exclude node:**
   ```bash
   curl -X PUT "https://your-opensearch-cluster:9200/_cluster/settings" \
   -H "Content-Type: application/json" \
   -d '{"transient": {"cluster.routing.allocation.exclude._name": "failed-node-name"}}'
   ```

### Cluster Red Status Recovery

1. **Identify unassigned shards:**
   ```bash
   curl -X GET "https://your-opensearch-cluster:9200/_cat/shards?v" | grep UNASSIGNED
   ```
2. **Check allocation explanation:**
   ```bash
   curl -X GET "https://your-opensearch-cluster:9200/_cluster/allocation/explain"
   ```
3. **Force allocation if needed (use with caution):**
   ```bash
   curl -X POST "https://your-opensearch-cluster:9200/_cluster/reroute" \
   -H "Content-Type: application/json" \
   -d '{
     "commands": [{
       "allocate_primary": {
         "index": "index-name",
         "shard": 0,
         "node": "node-name",
         "accept_data_loss": true
       }
     }]
   }'
   ```

---

## 📞 Escalation Matrix

### Severity Levels

**P1 - Critical (Immediate Response)**

- Cluster completely down
- Data loss detected
- Security breach
- Contact: On-call engineer (24/7)

**P2 - High (Response within 1 hour)**

- Cluster yellow status
- Single node failure
- Performance degradation >50%
- Contact: Operations team lead

**P3 - Medium (Response within 4 hours)**

- High memory usage (>90%)
- Slow queries
- Disk space warnings
- Contact: Platform team

**P4 - Low (Response within 24 hours)**

- Index growth alerts
- Capacity planning needs
- Configuration questions
- Contact: Standard support

---

## 🔍 Useful URLs

### Dashboards

- **Cluster Overview**: `https://your-opensearch-cluster:5601/_dashboards/app/dashboards`
- **Index Management**: `https://your-opensearch-cluster:5601/_dashboards/app/ism`
- **Security**: `https://your-opensearch-cluster:5601/_dashboards/app/security-dashboards-plugin`

### API Endpoints

- **Health**: `/_cluster/health`
- **Nodes**: `/_cat/nodes?v`
- **Indices**: `/_cat/indices?v`
- **Settings**: `/_cluster/settings`
- **Tasks**: `/_tasks`

### Documentation

- **OpenSearch Docs**: https://opensearch.org/docs/
- **REST API Reference**: https://opensearch.org/docs/latest/api-reference/
- **Troubleshooting Guide**: https://opensearch.org/docs/latest/troubleshoot/

---

_Quick Reference Guide | Version 1.0 | Last Updated: 2025-11-05_
