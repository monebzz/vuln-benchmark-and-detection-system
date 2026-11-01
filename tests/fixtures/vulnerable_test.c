#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define MAX_USERS 10

typedef struct {
    int id;
    char name[16];
    char role[8];
} User;

static User *users[MAX_USERS];

void greet_user(char *input) {
    char buffer[32];
    strcpy(buffer, input);
    printf("Hello, %s\n", buffer);
}

void log_message(char *msg) {
    printf(msg);
    printf("\n");
}

User *create_user(int id, const char *name) {
    User *u = (User *)malloc(sizeof(User));
    u->id = id;
    strncpy(u->name, name, sizeof(u->name));
    strcpy(u->role, "guest");
    return u;
}

void delete_user(int index) {
    free(users[index]);
    printf("User %d deleted\n", index);
}

void print_user(int index) {
    printf("ID: %d, Name: %s\n", users[index]->id, users[index]->name);
}

int *allocate_records(int count, int size) {
    int total = count * size;
    int *records = (int *)malloc(total);
    for (int i = 0; i < count; i++) {
        records[i] = 0;
    }
    return records;
}

void copy_tag(const char *src) {
    char tag[8];
    for (int i = 0; i <= 8; i++) {
        tag[i] = src[i];
    }
    printf("Tag: %s\n", tag);
}

void run_ping(char *host) {
    char cmd[128];
    sprintf(cmd, "ping -c 1 %s", host);
    system(cmd);
}

void read_input(void) {
    char name[20];
    printf("Enter name: ");
    gets(name);
    greet_user(name);
}

int main(int argc, char **argv) {
    if (argc < 2) {
        return 1;
    }

    users[0] = create_user(1, argv[1]);
    delete_user(0);
    print_user(0);
    delete_user(0);

    log_message(argv[1]);
    run_ping(argv[1]);
    copy_tag(argv[1]);
    read_input();

    int *r = allocate_records(atoi(argv[1]), 4096);
    free(r);

    return 0;
}
