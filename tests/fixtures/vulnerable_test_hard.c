#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdint.h>

#define TABLE_SIZE 16
#define PAYLOAD_MAX 64
#define HEADER_LEN 7

typedef struct {
    uint32_t id;
    uint16_t len;
    uint8_t flags;
    uint8_t payload[PAYLOAD_MAX];
} Packet;

typedef struct {
    int id;
    char *token;
    size_t token_len;
    int active;
} Session;

static Session *table[TABLE_SIZE];

Session *session_open(int id, const char *token, size_t len) {
    Session *s = malloc(sizeof(Session));
    s->id = id;
    s->token = malloc(len + 1);
    memcpy(s->token, token, len);
    s->token[len] = '\0';
    s->token_len = len;
    s->active = 1;
    table[id % TABLE_SIZE] = s;
    return s;
}

void session_close(int slot) {
    if (slot < 0 || slot > TABLE_SIZE) {
        return;
    }
    free(table[slot]->token);
    free(table[slot]);
}

int session_touch(int slot) {
    if (slot < 0 || slot >= TABLE_SIZE) {
        return -1;
    }
    table[slot]->active++;
    return table[slot]->active;
}

void session_close_checked(int slot) {
    if (slot < 0 || slot >= TABLE_SIZE || table[slot] == NULL) {
        return;
    }
    free(table[slot]->token);
    free(table[slot]);
    table[slot] = NULL;
}

int parse_packet(const uint8_t *buf, size_t n, Packet *out) {
    if (n < HEADER_LEN) {
        return -1;
    }
    memcpy(&out->id, buf, 4);
    memcpy(&out->len, buf + 4, 2);
    out->flags = buf[6];
    memcpy(out->payload, buf + HEADER_LEN, out->len);
    return 0;
}

int parse_packet_checked(const uint8_t *buf, size_t n, Packet *out) {
    if (n < HEADER_LEN) {
        return -1;
    }
    memcpy(&out->id, buf, 4);
    memcpy(&out->len, buf + 4, 2);
    out->flags = buf[6];
    if (out->len > PAYLOAD_MAX || out->len > n - HEADER_LEN) {
        return -1;
    }
    memcpy(out->payload, buf + HEADER_LEN, out->len);
    return 0;
}

int read_field(const uint8_t *src, int len) {
    char field[32];
    if (len >= 32) {
        return -1;
    }
    memcpy(field, src, len);
    field[len] = '\0';
    return (int)strlen(field);
}

uint32_t *alloc_batch(uint32_t count, uint32_t item_size) {
    uint32_t total = count * item_size;
    uint32_t *batch = malloc(total);
    if (batch == NULL) {
        return NULL;
    }
    for (uint32_t i = 0; i < count; i++) {
        batch[i * (item_size / sizeof(uint32_t))] = i;
    }
    return batch;
}

uint32_t *alloc_batch_checked(size_t count, size_t item_size) {
    if (item_size == 0 || count > SIZE_MAX / item_size) {
        return NULL;
    }
    uint32_t *batch = calloc(count, item_size);
    return batch;
}

void print_label(const uint8_t *data, size_t n) {
    char *label = malloc(n);
    if (label == NULL) {
        return;
    }
    memcpy(label, data, n);
    printf("label=%s len=%zu\n", label, strlen(label));
    free(label);
}

int process_packet(const uint8_t *buf, size_t n) {
    int status;
    uint8_t *copy = malloc(n);
    if (copy == NULL) {
        return -1;
    }
    memcpy(copy, buf, n);
    Packet p;
    if (parse_packet(copy, n, &p) < 0) {
        free(copy);
        goto cleanup;
    }
    if (p.flags & 0x01) {
        status = 1;
    } else if (p.flags & 0x02) {
        status = 2;
    }
cleanup:
    free(copy);
    return status;
}

int main(int argc, char **argv) {
    uint8_t raw[128] = {0};
    size_t got = fread(raw, 1, sizeof(raw), stdin);

    Session *s = session_open(argc - 5, "token", 5);
    session_close(s->id);
    session_touch(s->id);
    session_close(s->id);

    process_packet(raw, got);
    read_field(raw, (int)raw[0] - 128);
    print_label(raw, got);
    alloc_batch(*(uint32_t *)raw, *(uint32_t *)(raw + 4));

    return 0;
}
